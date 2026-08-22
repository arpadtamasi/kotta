import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

describe("one&a migration UI data", () => {
  const migrationWorkspace = resolve("examples/oneanda-migration/.kotta");

  test.skipIf(!existsSync(migrationWorkspace))("preserves the reviewed source count without treating a guess as a target", () => {
    const workspace = readWorkspace(migrationWorkspace);

    expect(workspace.migration).toMatchObject({
      legacy_ticket_count: 112,
      migrated_ticket_count: 113,
      package_count: 6,
    });
    expect(workspace.tasks).toHaveLength(113);
    expect(workspace.batches).toHaveLength(6);
    expect(workspace.tasks.find((task) => task.id === "T-001")).toMatchObject({ status: "done" });
    expect(workspace.batches.find((batch) => batch.id === "P-001")).toMatchObject({
      status: "done",
      tasks: ["T-054", "T-055"],
    });
    expect(workspace.migration?.split_audit.map((entry: { legacy_id: string }) => entry.legacy_id)).toEqual([
      "O-1",
      "O-9",
      "O-38",
    ]);
  });

  test("keeps native workspaces free of migration metadata", () => {
    const workspace = readWorkspace(resolve("examples/demo-project/.kotta"));

    expect(workspace.migration).toBeNull();
    expect(workspace.tasks).toHaveLength(4);
    expect(workspace.tasks.every((task) => task.migration === null)).toBe(true);
  });
});

describe("worktree-aware UI data", () => {
  function task(id: string, status: string, metadata = "") {
    return `---
id: ${id}
title: Effective task
status: ${status}
types: [bug]
profiles: [bug]
${metadata}---
# ${id} — Effective task

## Outcome

The effective state is visible.
`;
  }

  // Legacy-name fixture on purpose (T-020): the board must read a `.a-team/` workspace unchanged.
  function workspaceFixture() {
    const root = mkdtempSync(join(tmpdir(), "kotta-ui-data-"));
    mkdirSync(join(root, ".a-team/process/tasks"), { recursive: true });
    writeFileSync(join(root, ".a-team/config.yaml"), "version: 5\nproject:\n  name: fixture\n");
    writeFileSync(join(root, ".a-team/process/tasks/T-008-effective-task.md"), task("T-008", "defined"));
    return root;
  }

  test("uses the active worktree task once with its execution metadata", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/tasks"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/process/tasks/T-008-effective-task.md"), task(
      "T-008",
      "active",
      "branch: fix/T-008-effective-task\nassigned_agent: codex\n",
    ));

    const workspace = readWorkspace(root);

    expect(workspace.tasks.filter((candidate) => candidate.id === "T-008")).toEqual([
      expect.objectContaining({
        id: "T-008",
        status: "active",
        branch: "fix/T-008-effective-task",
        assigned_agent: "codex",
      }),
    ]);
    expect(workspace.diagnostics).toEqual([expect.objectContaining({ id: "T-008", message: expect.stringContaining("Legacy execution state") })]);
  });

  test("retains the coordinator task when no worktree directory exists", () => {
    const workspace = readWorkspace(workspaceFixture());

    expect(workspace.tasks).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics).toEqual([]);
  });

  test("falls back without duplication when the task worktree is stale", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/tasks"), { recursive: true });

    const workspace = readWorkspace(root);

    expect(workspace.tasks).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics).toEqual([
      expect.objectContaining({ entity: "task", id: "T-008", worktree: join(root, ".worktrees/T-008") }),
    ]);
  });

  test("falls back when worktree task metadata is malformed", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/tasks"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/process/tasks/T-008-effective-task.md"), task("T-999", "active"));

    const workspace = readWorkspace(root);

    expect(workspace.tasks).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics[0]?.message).toContain("does not match T-008");
  });
});
