import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

/**
 * Submission is a boundary and the tool holds it (SM-01m0f0wn89gjy6dbk1j6fjpv6j). Two failures on
 * 2026-08-29 were invisible because the record had no anchor: work continued against a task already
 * in review (F-01m14eq1kjmxz28f01k1vz7ytk), and execution began before its claim existed. Neither
 * could be caught, because the commit a submission stands on was computed for a prose table when a
 * declared check happened to run, and forgotten.
 *
 * Nothing here refuses: both shapes have honest instances, so the boundary is reported and the
 * human decides with the fact in front of them.
 */

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

function workspace(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-boundary-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  acceptFixtureSpec(root);
  return root;
}

/** A task carried to review, with its own worktree and one commit made under the claim. */
function submitted(label: string, options: { commitUnderClaim?: boolean } = {}) {
  const root = workspace(label);
  const created = run(root, ["task", "new", "--title", "Ship the slice", "--type", "feature"]) as { data: { id: string; path: string } };
  const { id, path } = created.data;
  run(root, ["task", "define", id, "--from", coveredDefinition(path, { outcome: "The slice ships.", acceptance: ["The slice is observable."], verification: "Run the tests." })]);
  git(root, "add", ".");
  if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", "define");

  run(root, ["task", "start", id, "--agent", "codex"]);
  const worktree = join(root, ".worktrees", id);
  if (options.commitUnderClaim !== false) {
    writeFileSync(join(worktree, "slice.ts"), "export const slice = true;\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: the slice");
  }
  const reviewed = run(worktree, ["task", "review", id, "--evidence", "The slice is observable.=verified by hand"]);
  return { root, id, worktree, filename: basename(path), reviewed };
}

const taskData = (root: string, filename: string) =>
  matter(readFileSync(join(root, ".kotta/process/tasks", filename), "utf8")).data as Record<string, unknown>;

describe("the commit a submission stands on", () => {
  test("is recorded even when no declared check ran", () => {
    const { root, worktree, filename, reviewed } = submitted("anchor");

    const stored = taskData(root, filename);
    // Prose evidence only: before this, nothing was recorded and the boundary had no anchor.
    expect(stored.review_commit).toBe(git(worktree, "rev-parse", "HEAD").trim());
    expect(String(stored.review_commit)).toMatch(/^[0-9a-f]{40}$/);
    expect(reviewed.data.reviewCommit).toBe(stored.review_commit);
  });
});

describe("work that lands after the submission", () => {
  test("is named by commit in the sweep, before the gate rather than after it", () => {
    const { root, id, worktree, filename } = submitted("beyond");
    const submittedAt = String(taskData(root, filename).review_commit);

    writeFileSync(join(worktree, "afterwards.ts"), "export const afterwards = true;\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "chore: after the submission");
    const later = git(worktree, "rev-parse", "HEAD").trim();

    const swept = run(root, ["sweep"]).data as { items: Array<{ id: string; category: string; reason: string }> };
    const waiting = swept.items.find((item) => item.id === id && item.category === "waiting-on-you")!;

    expect(waiting.reason).toContain("1 commit landed");
    expect(waiting.reason).toContain(submittedAt.slice(0, 7));
    expect(waiting.reason).toContain(later.slice(0, 7));
    expect(waiting.reason).toContain("outside what the review was asked to accept");
  });

  test("is named at the close gate, and never silently accepted", () => {
    const { root, id, worktree } = submitted("gate");
    writeFileSync(join(worktree, "afterwards.ts"), "export const afterwards = true;\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "chore: after the submission");
    git(root, "merge", "--no-ff", git(worktree, "rev-parse", "--abbrev-ref", "HEAD").trim(), "-m", "merge");

    const spoken = attempt(root, ["task", "close", id, "--approve"]);

    // Reported, not refused: the close succeeds and says what it accepted.
    expect(spoken.status, spoken.stderr).toBe(0);
    expect(spoken.stdout).toContain("landed on");
    expect(spoken.stdout).toContain("after the submission");
  });

  test("says nothing when nothing landed after it", () => {
    const { root, id } = submitted("clean");
    const swept = run(root, ["sweep"]).data as { items: Array<{ id: string; category: string; reason: string }> };
    const waiting = swept.items.find((item) => item.id === id && item.category === "waiting-on-you")!;

    expect(waiting.reason).toBe("submitted for review; nothing moves until it is accepted or sent back");
  });
});

describe("a claim that accounted for nothing", () => {
  test("is said at submission, where the record can still be corrected", () => {
    const { reviewed } = submitted("unaccounted", { commitUnderClaim: false });

    expect(reviewed.data.unaccountedClaim).toContain("No commit landed between the start");
    expect(reviewed.data.unaccountedClaim).toContain("the record cannot account for");
  });

  test("is not said when the claim committed something", () => {
    const { reviewed } = submitted("accounted");
    expect(reviewed.data.unaccountedClaim).toBeNull();
  });
});
