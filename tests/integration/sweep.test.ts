import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { sweep, SWEEP_CATEGORIES, type SweepCategory } from "../../src/commands/sweep.js";

/**
 * Sweep answers what has stopped and why (UC-01m0f0wn89m98wpkqq8e5c9p6p).
 *
 * Every category is built from state a fixture actually reaches, and asserted to appear there and
 * nowhere else — a category that can be produced by construction but never by the workspace would
 * report a truth nobody can act on.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000sw";

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-sweep-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/swept-000000sw.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Swept", "---", "",
    "## Definition", "The work is swept.", "", "## Usage", "Sweep fixture.", "", "## Non-examples", "Unswept work.", "",
  ].join("\n"));
  git(root, "add", ".");
  git(root, "commit", "-m", "workspace");
  return root;
}

function definedTask(root: string, title: string): string {
  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The work is observable.")
    .replace("- Define an observable condition.", "- The work is swept.")
    .replace("- Explain how acceptance will be checked.", "- Run the sweep test.");
  // Outside the repository: a stray file in the root is a dirty tree, and start refuses one.
  const source = join(mkdtempSync(join(tmpdir(), "kotta-sweep-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The work is swept.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (attempt(root, ["task", "define", created.data.id, "--from", source, "--json"]).status !== 0) throw new Error("define failed");
  return created.data.id;
}

/** The categories an item of this id lands in — the "and nowhere else" half of every case. */
function categoriesFor(root: string, id: string): SweepCategory[] {
  return sweep(root).data.items.filter((item) => item.id === id).map((item) => item.category);
}

describe("sweep answers what has stopped", () => {
  test("a still workspace says so in one line, and writes nothing", () => {
    const root = fixture("still");
    const result = attempt(root, ["sweep"]);
    expect(result.status).toBe(0);
    expect(say(result).trim().split("\n")).toHaveLength(1);
    expect(say(result)).toContain("Nothing has stopped");
    // The thresholds are named even when nothing was filtered, so a wrong default is visible.
    expect(say(result)).toContain("4h");
    expect(say(result)).toContain("7d");
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  test("waiting-on-you: a task in review, and nowhere else", () => {
    const root = fixture("review");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: deliver");
    expect(attempt(worktree, ["task", "review", id, "--evidence", "delivered and read", "--json"]).status).toBe(0);

    expect(categoriesFor(root, id)).toEqual(["waiting-on-you"]);
    const item = sweep(root).data.items.find((candidate) => candidate.id === id)!;
    expect(item.action, "the one action that would move it").toContain(`kotta task close ${id} --approve`);
  });

  test("stalled: claimed, and the branch has not moved past the threshold", () => {
    const root = fixture("stalled");
    const id = definedTask(root, "Ship the exporter");
    expect(attempt(root, ["task", "start", id, "--agent", "codex", "--json"]).status).toBe(0);

    // Below the threshold the same state is not stalled: it is work in flight.
    expect(categoriesFor(root, id)).toEqual([]);
    // A clock far enough ahead is the same fact as a branch that has not moved.
    const later = Date.now() + 5 * 3_600_000;
    const stalled = sweep(root, {}, later).data.items.filter((item) => item.id === id);
    expect(stalled.map((item) => item.category)).toEqual(["stalled"]);
    expect(stalled[0].reason, "the threshold that produced it").toContain("threshold 4h");
    // And it is a heuristic, not a truth: raising the threshold takes it back out.
    expect(sweep(root, { stalledHours: 24 }, later).data.items.filter((item) => item.id === id)).toEqual([]);
  });

  test("undeclared-deviation: closed with a deviation no observation records", () => {
    const root = fixture("deviation");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");
    attempt(worktree, ["task", "review", id, "--evidence", "delivered", "--deviations", "Skipped the diagram; text only.", "--json"]);
    git(root, "merge", "--no-ff", `feat/${id}-ship-the-exporter`, "-m", "merge");
    expect(attempt(root, ["task", "close", id, "--approve", "--json"]).status).toBe(0);

    expect(categoriesFor(root, id)).toEqual(["undeclared-deviation"]);
  });

  test("a deviation that named an observation is not reported", () => {
    const root = fixture("declared");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");
    attempt(worktree, ["task", "review", id, "--evidence", "delivered", "--deviations", "Skipped the diagram.", "--observations-created", "F-101", "--json"]);
    git(root, "merge", "--no-ff", `feat/${id}-ship-the-exporter`, "-m", "merge");
    attempt(root, ["task", "close", id, "--approve", "--json"]);

    expect(categoriesFor(root, id)).toEqual([]);
  });

  test("an observation captured during the task clears it, without reopening or an edit by hand", () => {
    const root = fixture("linked");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");
    // Reviewed with a deviation and the prose section left saying nothing — the shape thirty tasks
    // in this repository are in.
    attempt(worktree, ["task", "review", id, "--evidence", "delivered", "--deviations", "Skipped the diagram; text only.", "--json"]);
    git(root, "merge", "--no-ff", `feat/${id}-ship-the-exporter`, "-m", "merge");
    attempt(root, ["task", "close", id, "--approve", "--json"]);
    expect(categoriesFor(root, id), "reported while nothing records it").toEqual(["undeclared-deviation"]);

    // The action the item names, run exactly as printed.
    const item = sweep(root).data.items.find((candidate) => candidate.id === id)!;
    expect(item.action).toContain(`--discovered-during ${id}`);
    expect(attempt(root, ["observation", "new", "--title", "The diagram is missing", "--type", "technical-debt",
      "--evidence", "The exporter shipped without it.", "--discovered-during", id, "--json"]).status).toBe(0);

    // Cleared: no reopen, no file edited by hand, and the task's own prose still says nothing.
    expect(categoriesFor(root, id)).toEqual([]);
    const stored = readdirSync(join(root, ".kotta/process/tasks")).find((name) => name.includes(id.slice(-8)))!;
    expect(readFileSync(join(root, ".kotta/process/tasks", stored), "utf8")).toContain("Skipped the diagram");
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 120_000);

  test("undispositioned: an observation left in new past the threshold", () => {
    const root = fixture("undispositioned");
    const created = JSON.parse(say(attempt(root, ["observation", "new", "--title", "The importer logs nothing", "--type", "bug", "--evidence", "Seen in the fixture.", "--json"]))) as { data: { id: string } };

    expect(categoriesFor(root, created.data.id), "captured today is not forgotten").toEqual([]);
    const later = Date.now() + 8 * 86_400_000;
    const stale = sweep(root, {}, later).data.items.filter((item) => item.id === created.data.id);
    expect(stale.map((item) => item.category)).toEqual(["undispositioned"]);
    expect(stale[0].reason).toContain("threshold 7d");
  });

  test("drift: active with no claim", () => {
    const root = fixture("drift");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    // The claim gone, the task still active: the state on disk and the state Kotta believes differ.
    execFileSync("rm", ["-f", join(root, ".kotta/process/claims", `${id}.yaml`)]);

    expect(categoriesFor(root, id)).toEqual(["drift"]);
    expect(sweep(root).data.items.find((item) => item.id === id)!.reason).toContain("no claim");
  });

  test("the report is ranked, deterministic, and changes nothing", () => {
    const root = fixture("ranked");
    const reviewed = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", reviewed, "--agent", "codex", "--json"]);
    const worktree = join(root, ".worktrees", reviewed);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");
    attempt(worktree, ["task", "review", reviewed, "--evidence", "delivered", "--json"]);
    const observation = JSON.parse(say(attempt(root, ["observation", "new", "--title", "Noticed", "--type", "bug", "--evidence", "Seen.", "--json"]))) as { data: { id: string } };
    void observation;
    git(root, "add", "-A");
    // review already commits the control state; a second commit may have nothing to add.
    spawnSync("git", ["commit", "-m", "state"], { cwd: root, encoding: "utf8" });

    const first = attempt(root, ["sweep"]);
    const second = attempt(root, ["sweep"]);
    expect(say(first)).toBe(say(second));
    expect(git(root, "status", "--porcelain"), "sweep is what you run when you do not trust the state").toBe("");

    const order = sweep(root).data.items.map((item) => SWEEP_CATEGORIES.indexOf(item.category));
    expect([...order].sort((a, b) => a - b), "ranked by what standing still costs").toEqual(order);
  });

  test("it runs where validate refuses", () => {
    const root = fixture("broken");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    // Two files claiming one id: validate has an opinion about this, and sweep must still answer.
    const path = join(root, ".kotta/process/tasks", `ship-the-exporter-${id.slice(-8)}.md`);
    writeFileSync(join(root, ".kotta/process/tasks", `duplicate-${id.slice(-8)}.md`), readFileSync(path, "utf8"));

    expect(attempt(root, ["validate"]).status, "validate refuses").not.toBe(0);
    const swept = attempt(root, ["sweep"]);
    expect(swept.status, "sweep does not").toBe(0);
    expect(existsSync(path)).toBe(true);
  });

  test("a category with more than a screenful shows the oldest and counts the rest", () => {
    const root = fixture("capped");
    // Five observations old enough to be undispositioned: more than the default output shows.
    const ids = ["one", "two", "three", "four", "five"].map((label) =>
      (JSON.parse(say(attempt(root, ["observation", "new", "--title", `Noticed ${label}`, "--type", "bug", "--evidence", "Seen.", "--json"]))) as { data: { id: string } }).data.id);
    expect(ids).toHaveLength(5);

    const report = say(attempt(root, ["sweep", "--undispositioned-days", "0"]));
    expect(report, "the count is the whole truth").toContain("undispositioned (5)");
    // Named, never silently dropped: a report that hides what it left out is worse than a long one.
    expect(report).toContain("2 more, oldest first");
    expect(report).toContain("--json for all of them");
    expect(report.trim().split("\n").length, "and it still fits a screen").toBeLessThan(20);

    const parsed = JSON.parse(say(attempt(root, ["sweep", "--undispositioned-days", "0", "--json"]))) as { data: { items: unknown[] } };
    expect(parsed.data.items, "completeness lives in --json").toHaveLength(5);
  });

  test("--json carries every item with its category, reason and action", () => {
    const root = fixture("json");
    const id = definedTask(root, "Ship the exporter");
    attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    execFileSync("rm", ["-f", join(root, ".kotta/process/claims", `${id}.yaml`)]);

    const parsed = JSON.parse(say(attempt(root, ["sweep", "--json"]))) as {
      ok: boolean;
      data: { thresholds: { stalledHours: number }; items: Array<{ category: string; id: string; reason: string; action: string }> };
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.data.thresholds.stalledHours).toBe(4);
    for (const item of parsed.data.items) {
      expect(SWEEP_CATEGORIES).toContain(item.category as SweepCategory);
      expect(item.reason.length, `${item.id} states why`).toBeGreaterThan(0);
      expect(item.action.length, `${item.id} states the one action`).toBeGreaterThan(0);
    }
  });
});
