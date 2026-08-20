import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { appendEvent, readEvents, validateEvent } from "../../src/core/events.js";
import { initializeWorkspace } from "../../src/filesystem/workspace.js";
import { withControlPlaneMutation } from "../../src/git/control-plane.js";

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-events-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  initializeWorkspace({ root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-m", "fixture"], { cwd: root });
  return root;
}

const TASK = "T-01kz8tk2t53jbax6mrseka50v9";

describe("canonical events", () => {
  test("validates, orders and idempotently republishes visible messages", () => {
    const root = repository("order");
    const first = appendEvent(root, { entity: TASK, task: TASK, kind: "message", role: "human", text: "First", client_event_id: "client-1", created_at: "2026-08-05T10:00:00.000Z" });
    const duplicate = appendEvent(root, { entity: TASK, task: TASK, kind: "message", role: "human", text: "Ignored duplicate", client_event_id: "client-1" });
    appendEvent(root, { entity: TASK, task: TASK, kind: "message", role: "assistant", text: "Second", attempt_of: first.event.id, created_at: "2026-08-05T10:00:01.000Z" });

    expect(duplicate).toMatchObject({ created: false, event: { id: first.event.id, text: "First" } });
    expect(readEvents(root, TASK).map((event) => event.text)).toEqual(["First", "Second"]);
    expect(validateEvent(first.event)).toEqual([]);
  });

  test("serializes writers, times out clearly and recovers a dead owner's lock", () => {
    const root = repository("lock");
    expect(() => withControlPlaneMutation(root, () => withControlPlaneMutation(root, () => undefined, { timeoutMs: 20 }))).toThrow(/control plane is busy/i);
    expect(withControlPlaneMutation(root, () => "released")).toBe("released");

    const lock = join(root, ".git", "kotta-mutation.lock");
    mkdirSync(lock);
    writeFileSync(join(lock, "owner.json"), `${JSON.stringify({ pid: 999_999_999 })}\n`);
    expect(withControlPlaneMutation(root, () => "recovered")).toBe("recovered");
    expect(existsSync(lock)).toBe(false);
  });
});
