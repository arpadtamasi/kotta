import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { branchName } from "../../src/commands/contract.js";
import { planBatchWaves } from "../../src/commands/batch.js";
import { validateClaim } from "../../src/core/claim.js";
import { invocationWriteFailure, resolveAgentCommand } from "../../src/commands/execute.js";
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
    // A headless agent that must ask before every edit implements nothing, so the
    // configured invocation is checked before launch instead of after an empty run.
    expect(invocationWriteFailure("claude", resolveAgentCommand("claude").args)).toBeNull();
    expect(invocationWriteFailure("claude", ["-p"])).toContain("--permission-mode");
    expect(invocationWriteFailure("claude", ["-p", "--permission-mode"])).toContain("--permission-mode");
    expect(invocationWriteFailure("claude", ["-p", "--permission-mode", "plan"])).toContain("forbids edits");
    expect(invocationWriteFailure("codex", resolveAgentCommand("codex").args)).toBeNull();
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
