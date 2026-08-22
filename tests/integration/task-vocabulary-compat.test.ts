import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { mintEventId } from "../../src/core/identity.js";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");

function git(root: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: root });
}

function invoke(root: string, args: string[]) {
  return spawnSync("node", [cli, ...args], { cwd: root, encoding: "utf8" });
}

function run(root: string, args: string[]): { data: Record<string, unknown> } {
  const result = invoke(root, [...args, "--json"]);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function previousWorkspace(): { root: string; task: string; batch: string; observation: string } {
  const root = mkdtempSync(join(tmpdir(), "kotta-task-v3-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  run(root, ["init"]);
  const task = String(run(root, ["task", "new", "--title", "Legacy member", "--type", "feature"]).data.id);
  const batchResult = run(root, ["batch", "new", "--title", "Legacy batch", "--goal", "Ship it"]).data;
  const batch = String(batchResult.id);
  run(root, ["batch", "add", batch, task]);
  const observationResult = run(root, ["observation", "new", "--title", "Legacy link", "--type", "inconsistency", "--evidence", "A stored v3 field"]).data;
  const observation = String(observationResult.id);

  const batchPath = String(batchResult.path);
  writeFileSync(batchPath, readFileSync(batchPath, "utf8")
    .replace("tasks:", "contracts:")
    .replace("create_subtasks:", "create_subcontracts:")
    .replace("reorder_independent_tasks:", "reorder_independent_contracts:"));
  const observationPath = String(observationResult.path);
  const parsedObservation = matter(readFileSync(observationPath, "utf8"));
  writeFileSync(observationPath, matter.stringify(parsedObservation.content, { ...parsedObservation.data, contract: task }));
  const claimPath = join(root, `.kotta/process/claims/${task}.yaml`);
  mkdirSync(dirname(claimPath), { recursive: true });
  writeFileSync(claimPath, `contract: ${task}\nagent: codex\nbranch: feat/legacy\nworktree: .worktrees/legacy\nstarted_at: 2026-08-20T10:00:00Z\n`);
  const eventId = mintEventId();
  const eventPath = join(root, `.kotta/process/events/${task}/${eventId}.json`);
  mkdirSync(dirname(eventPath), { recursive: true });
  writeFileSync(eventPath, `${JSON.stringify({ id: eventId, entity: task, contract: task, kind: "lifecycle", created_at: "2026-08-20T10:00:00.000Z", state: "backlog", summary: "Legacy task captured." }, null, 2)}\n`);
  const config = join(root, ".kotta/config.yaml");
  writeFileSync(config, readFileSync(config, "utf8")
    .replace("version: 5", "version: 3")
    .replace("allow_agent_defined_tasks:", "allow_agent_defined_contracts:"));
  git(root, "add", ".");
  git(root, "commit", "-m", "previous vocabulary workspace");
  return { root, task, batch, observation };
}

describe("task vocabulary compatibility", () => {
  test("a v3 workspace is refused by name, and the contract alias is gone", () => {
    const { root } = previousWorkspace();
    // The compatibility window is one schema version: v5 readers refuse anything older and name
    // the command that carries it forward, instead of half-understanding the stored vocabulary.
    const refused = invoke(root, ["task", "list", "--json"]);
    expect(refused.status).toBe(1);
    expect(`${refused.stdout}${refused.stderr}`).toContain("kotta migrate");

    const alias = invoke(root, ["contract", "list", "--json"]);
    expect(alias.status).not.toBe(0);

    const board = readWorkspace(root);
    expect(board.tasks).toEqual([]);
    expect(board.notices.join("\n")).toContain("kotta migrate");
  });

  test("migrates every stored v3 relationship and keeps ids stable", () => {
    const { root, task, batch, observation } = previousWorkspace();
    const planned = invoke(root, ["migrate", "--dry-run"]);
    expect(planned.status, planned.stderr).toBe(0);
    for (const change of ["contracts → tasks", "contract → task", "allow_agent_defined_contracts → allow_agent_defined_tasks"]) {
      expect(planned.stdout).toContain(change);
    }

    run(root, ["migrate"]);
    // The board reads the base ref, so the migrated bytes have to land on it first.
    git(root, "add", "-A");
    git(root, "commit", "-m", "migrate");
    const board = readWorkspace(root);
    expect(board.tasks.map((entry) => entry.id)).toContain(task);
    expect(board.batches.find((entry) => entry.id === batch)?.tasks).toEqual([task]);
    expect(board.observations.find((entry) => entry.id === observation)?.task).toBe(task);
    expect(board.claims[0].task).toBe(task);
    expect(board.events[0].task).toBe(task);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("version: 5");
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
  });
});
