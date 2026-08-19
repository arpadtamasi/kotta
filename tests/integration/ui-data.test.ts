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
    expect(workspace.contracts).toHaveLength(113);
    expect(workspace.batches).toHaveLength(6);
    expect(workspace.contracts.find((contract) => contract.id === "T-001")).toMatchObject({ status: "done" });
    expect(workspace.batches.find((batch) => batch.id === "P-001")).toMatchObject({
      status: "done",
      contracts: ["T-054", "T-055"],
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
    expect(workspace.contracts).toHaveLength(4);
    expect(workspace.contracts.every((contract) => contract.migration === null)).toBe(true);
  });
});

describe("worktree-aware UI data", () => {
  function contract(id: string, status: string, metadata = "") {
    return `---
id: ${id}
title: Effective contract
status: ${status}
types: [bug]
profiles: [bug]
${metadata}---
# ${id} — Effective contract

## Outcome

The effective state is visible.
`;
  }

  // Legacy-name fixture on purpose (T-020): the board must read a `.a-team/` workspace unchanged.
  function workspaceFixture() {
    const root = mkdtempSync(join(tmpdir(), "kotta-ui-data-"));
    mkdirSync(join(root, ".a-team/process/defined"), { recursive: true });
    writeFileSync(join(root, ".a-team/config.yaml"), "version: 3\nproject:\n  name: fixture\n");
    writeFileSync(join(root, ".a-team/process/defined/T-008-effective-contract.md"), contract("T-008", "defined"));
    return root;
  }

  test("uses the active worktree contract once with its execution metadata", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/active"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/process/active/T-008-effective-contract.md"), contract(
      "T-008",
      "active",
      "branch: fix/T-008-effective-contract\nassigned_agent: codex\n",
    ));

    const workspace = readWorkspace(root);

    expect(workspace.contracts.filter((candidate) => candidate.id === "T-008")).toEqual([
      expect.objectContaining({
        id: "T-008",
        status: "active",
        branch: "fix/T-008-effective-contract",
        assigned_agent: "codex",
      }),
    ]);
    expect(workspace.diagnostics).toEqual([expect.objectContaining({ id: "T-008", message: expect.stringContaining("Legacy execution state") })]);
  });

  test("retains the coordinator contract when no worktree directory exists", () => {
    const workspace = readWorkspace(workspaceFixture());

    expect(workspace.contracts).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics).toEqual([]);
  });

  test("falls back without duplication when the contract worktree is stale", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/active"), { recursive: true });

    const workspace = readWorkspace(root);

    expect(workspace.contracts).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics).toEqual([
      expect.objectContaining({ entity: "contract", id: "T-008", worktree: join(root, ".worktrees/T-008") }),
    ]);
  });

  test("falls back when worktree contract metadata is malformed", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".worktrees/T-008/.a-team/process/active"), { recursive: true });
    writeFileSync(join(root, ".worktrees/T-008/.a-team/process/active/T-008-effective-contract.md"), contract("T-999", "active"));

    const workspace = readWorkspace(root);

    expect(workspace.contracts).toEqual([expect.objectContaining({ id: "T-008", status: "defined" })]);
    expect(workspace.diagnostics[0]?.message).toContain("does not match T-008");
  });
});
