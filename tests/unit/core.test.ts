import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { branchName } from "../../src/commands/contract.js";
import { planBatchWaves } from "../../src/commands/batch.js";
import { validateClaim } from "../../src/core/claim.js";
import { invocationWriteFailure, invocationWriteWarning, resolveAgentCommand } from "../../src/commands/execute.js";
import { readAgentPermissionMode } from "../../src/core/config.js";
import { initializeWorkspace } from "../../src/filesystem/workspace.js";
import { canonicalEntityId } from "../../src/filesystem/entities.js";
import { CONTRACT_ID, displayId, entityFilename, filenameMatchesId, isMintedId, mintId, shortId } from "../../src/core/identity.js";
import { createDecision } from "../../src/commands/decision.js";
import { decisionDraftFromSource, renderDecision, validateDecision } from "../../src/core/decision.js";

const git = (cwd: string, ...args: string[]): string => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

describe("core deterministic rules", () => {
  test("generates stable branch names from contract type and title", () => {
    expect(branchName("performance", "T-018", "Faster export: P95 ≤ 2s")).toBe("perf/T-018-faster-export-p95-2s");
  });

  test("plans dependency waves and rejects cycles", () => {
    expect(planBatchWaves(["T-001", "T-002", "T-003"], new Map([
      ["T-001", []], ["T-002", ["T-001"]], ["T-003", []],
    ]))).toEqual([["T-001", "T-003"], ["T-002"]]);
    expect(() => planBatchWaves(["T-001", "T-002"], new Map([
      ["T-001", ["T-002"]], ["T-002", ["T-001"]],
    ]))).toThrow("Dependency cycle detected");
  });

  test("mints identifiers without reading the workspace, so two branches cannot collide", () => {
    const minted = new Set(Array.from({ length: 2000 }, () => mintId("T")));
    expect(minted.size).toBe(2000);
    for (const id of minted) expect(CONTRACT_ID.test(id)).toBe(true);
    // Time-sortable: an id minted later sorts after one minted earlier, lexicographically.
    expect(mintId("T", 1_700_000_000_000) < mintId("T", 1_700_000_000_001)).toBe(true);
    expect(isMintedId("T-034")).toBe(false);
  });

  test("keeps sequential identifiers valid and resolvable beside minted ones (D-010)", () => {
    for (const legacy of ["T-001", "T-034", "O-107", "O-38.1"]) expect(CONTRACT_ID.test(legacy)).toBe(true);
    expect(CONTRACT_ID.test("T-01")).toBe(false);

    const id = mintId("T");
    expect(entityFilename(id, "ship-export")).toBe(`ship-export-${shortId(id)}.md`);
    expect(entityFilename("T-034", "ship-export")).toBe("T-034-ship-export.md");
    expect(displayId(id)).toBe(`T-${shortId(id)}`);
    expect(displayId("T-034")).toBe("T-034");

    expect(filenameMatchesId("T-034-ship-export.md", "T-034")).toBe(true);
    expect(filenameMatchesId("T-0341-other.md", "T-034")).toBe(false);
    expect(filenameMatchesId(`ship-export-${shortId(id)}.md`, id)).toBe(true);
    // Write candidates are validated before they are published under their final name.
    expect(filenameMatchesId(`ship-export-${shortId(id)}.md.cancel-42.tmp`, id)).toBe(true);
    expect(filenameMatchesId("ship-export-deadbeef.md", id)).toBe(false);
  });

  test("validates the complete claim contract", () => {
    expect(validateClaim({ contract: "T-014", agent: "codex", branch: "feat/T-014-export", worktree: ".worktrees/T-014", started_at: "2026-07-21T10:15:00+02:00" })).toEqual([]);
    expect(validateClaim({ contract: "O-107", agent: "codex", branch: "feat/O-107-audit", worktree: ".worktrees/O-107", started_at: "2026-07-21T10:15:00+02:00" })).toEqual([]);
    const minted = mintId("T");
    expect(validateClaim({ contract: minted, agent: "codex", branch: `feat/${minted}-export`, worktree: `.worktrees/${minted}`, started_at: "2026-07-21T10:15:00+02:00" })).toEqual([]);
    expect(validateClaim({ contract: "bad" })).toEqual([
      "contract must be a minted id, T-001, or an imported O-1 identifier", "agent is required", "branch is required", "worktree is required", "started_at must be an ISO timestamp",
    ]);
  });

  test("allocates, validates, and renders durable decision records", () => {
    const draft = decisionDraftFromSource(
      "---\ntitle: Adopt blue-green cutover\n---\n## Decision\n\nUse blue-green.\n\n## Context\n\nAvoid downtime.\n\n## Consequences\n\nOperate two stacks during cutover.\n",
      "D-003",
      "2026-07-23",
    );
    expect(validateDecision(draft)).toEqual([]);
    expect(renderDecision(draft)).toContain("id: D-003");
    expect(decisionDraftFromSource(
      "---\ntitle: Dated decision\ndate: 2026-07-22\n---\n## Decision\n\nYes.\n\n## Context\n\nNeeded.\n\n## Consequences\n\nKnown.\n",
      "D-004",
      "2026-07-23",
    ).date).toBe("2026-07-22");
    expect(validateDecision({ ...draft, date: "2026-02-30", context: "" })).toEqual([
      expect.objectContaining({ code: "INVALID_DECISION_DATE" }),
      expect.objectContaining({ code: "MISSING_DECISION_SECTION", message: expect.stringContaining("Context") }),
    ]);
  });

  test("names the cause when an agent invocation structurally cannot write", () => {
    // Only a mode that forbids edits by definition is a launch-time refusal. An
    // unstated mode is not: the agent's own settings decide it and Kotta cannot
    // read them, so it warns and lets the baseline comparison report the truth.
    expect(invocationWriteFailure("claude", ["-p", "--permission-mode", "plan"])).toContain("forbids edits");
    expect(invocationWriteFailure("claude", ["-p"])).toBeNull();
    expect(invocationWriteFailure("claude", ["-p", "--permission-mode"])).toBeNull();
    expect(invocationWriteFailure("claude", ["-p", "--permission-mode", "bypassPermissions"])).toBeNull();
    expect(invocationWriteFailure("codex", resolveAgentCommand("codex").args)).toBeNull();
  });

  test("warns, rather than refusing, when nothing states what the agent may do", () => {
    expect(invocationWriteWarning("claude", ["-p"])).toContain("agents.permission_mode");
    expect(invocationWriteWarning("claude", ["-p", "--permission-mode", "acceptEdits"])).toBeNull();
    expect(invocationWriteWarning("codex", ["exec", "-"])).toBeNull();
  });

  test("the permission mode comes from the workspace, and is absent until one is set", () => {
    // Kotta ships no default mode: an unconfigured workspace grants nothing the
    // caller did not already grant through the agent's own settings.
    const root = mkdtempSync(join(tmpdir(), "kotta-permission-mode-"));
    git(root, "init", "-b", "main");
    writeFileSync(join(root, "README.md"), "fixture\n");
    initializeWorkspace({ root });
    expect(readAgentPermissionMode(root)).toBeNull();
    expect(resolveAgentCommand("claude", root).args).toEqual(["-p"]);

    const configPath = join(root, ".kotta", "config.yaml");
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace("permission_mode: null", "permission_mode: bypassPermissions"));
    expect(readAgentPermissionMode(root)).toBe("bypassPermissions");
    expect(resolveAgentCommand("claude", root).args).toEqual(["-p", "--permission-mode", "bypassPermissions"]);
    // The mode is a claude concept; another agent's invocation is untouched by it.
    expect(resolveAgentCommand("codex", root).args).toEqual(["exec", "-"]);
  });

  test("rejects a duplicate decision without changing the existing record", () => {
    // Legacy-name workspace on purpose (T-020): the decision writer must find `.a-team/` as well.
    const root = mkdtempSync(join(tmpdir(), "kotta-decision-duplicate-"));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    mkdirSync(join(root, ".a-team/decisions"), { recursive: true });
    const source = join(root, "decision.md");
    writeFileSync(source, "---\ntitle: Cut over\n---\n## Decision\n\nProceed.\n\n## Context\n\nReady.\n\n## Consequences\n\nMonitor.\n");
    createDecision({ from: source, id: "D-001", approved: true }, root);
    const canonical = join(root, ".a-team/decisions/D-001.md");
    const before = readFileSync(canonical, "utf8");
    expect(() => createDecision({ from: source, id: "D-001", approved: true }, root)).toThrow("already exists");
    expect(readFileSync(canonical, "utf8")).toBe(before);
  });
});

describe("short ids resolve to one entity", () => {
  test("an ambiguous short id is refused naming every full id it matched", () => {
    // Two ULIDs sharing their last eight characters. Unlikely, not impossible — and
    // a command that silently picked one could never be corrected afterwards.
    const root = mkdtempSync(join(tmpdir(), "kotta-ambiguous-"));
    git(root, "init", "-b", "main");
    writeFileSync(join(root, "README.md"), "fixture\n");
    initializeWorkspace({ root });
    const first = "T-01kzaaaaaaaaaaaaaacdefgh23";
    const second = "T-01kzbbbbbbbbbbbbbbcdefgh23";
    const backlog = join(root, ".kotta", "backlog");
    // entityFilename derives the filename from the short id, so these two would collide
    // there too; the id in the frontmatter is what identifies the entity.
    for (const [slug, id] of [["colliding-one", first], ["colliding-two", second]] as const) {
      writeFileSync(join(backlog, `${slug}-${id.slice(-8)}.md`), `---\nid: ${id}\ntitle: Colliding\nstatus: backlog\n---\n# ${id}\n`);
    }

    expect(() => canonicalEntityId(root, "contract", "T-cdefgh23")).toThrow(/ambiguous/);
    expect(() => canonicalEntityId(root, "contract", "T-cdefgh23")).toThrow(new RegExp(first));
    expect(() => canonicalEntityId(root, "contract", "T-cdefgh23")).toThrow(new RegExp(second));
    // Naming one in full is never ambiguous, and an unknown id is passed through
    // unchanged so the command's own "not found" is what the reader sees.
    expect(canonicalEntityId(root, "contract", first)).toBe(first);
    expect(canonicalEntityId(root, "contract", "T-nope")).toBe("T-nope");
  });
});
