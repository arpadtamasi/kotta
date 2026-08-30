import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { sweep } from "../../src/commands/sweep.js";

/**
 * A deviation that left nothing behind has a way to say so (UC-01m0f0wn89dy38s6whbfa0jafn).
 *
 * `undeclared-deviation` had two exits, and both write something new: an observation naming the
 * task, or prose that can only be written at submission. A done task whose deviation genuinely left
 * nothing behind could take neither, so the category could only grow. This is the third exit, and
 * it is a record of fact — never an approval, because nobody was asked.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000st";

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-settle-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/settled-000000st.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Settled", "---", "",
    "## Definition", "The deviation is settled.", "", "## Usage", "Settle fixture.", "", "## Non-examples", "An unsettled deviation.", "",
  ].join("\n"));
  git(root, "add", ".");
  git(root, "commit", "-m", "workspace");
  return root;
}

function definedTask(root: string, title: string): string {
  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The work is observable.")
    .replace("- Define an observable condition.", "- The deviation is settled.")
    .replace("- Explain how acceptance will be checked.", "- Run the settle test.");
  const source = join(mkdtempSync(join(tmpdir(), "kotta-settle-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The deviation is settled.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (attempt(root, ["task", "define", created.data.id, "--from", source, "--json"]).status !== 0) throw new Error("define failed");
  return created.data.id;
}

/** Take a task to review, with whatever it declared under Deviations. */
function reviewed(root: string, deviations: string | null): string {
  const id = definedTask(root, "Ship the exporter");
  attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
  const worktree = join(root, ".worktrees", id);
  writeFileSync(join(worktree, "done.md"), "# Done\n");
  git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");
  const args = ["task", "review", id, "--evidence", "delivered", "--json"];
  if (deviations) args.splice(5, 0, "--deviations", deviations);
  if (attempt(worktree, args).status !== 0) throw new Error("review failed");
  return id;
}

/** Review, merge and close — the state the sweep's item is reported from. */
function closed(root: string, deviations: string | null): string {
  const id = reviewed(root, deviations);
  git(root, "merge", "--no-ff", `feat/${id}-ship-the-exporter`, "-m", "merge");
  if (attempt(root, ["task", "close", id, "--approve", "--json"]).status !== 0) throw new Error("close failed");
  return id;
}

function stored(root: string, id: string): { data: Record<string, unknown>; content: string } {
  const directory = join(root, ".kotta/process/tasks");
  const name = readdirSync(directory).find((candidate) => candidate.includes(id.slice(-8)))!;
  const parsed = matter(readFileSync(join(directory, name), "utf8"));
  return { data: parsed.data as Record<string, unknown>, content: parsed.content };
}

describe("a deviation that left nothing behind has a way to say so", () => {
  test("settling it with a reason takes it out of the sweep", () => {
    const root = fixture("clears");
    const id = closed(root, "Skipped the diagram; text only.");
    expect(sweep(root).data.items.filter((item) => item.id === id).map((item) => item.category)).toEqual(["undeclared-deviation"]);

    // The action the item names, run exactly as printed.
    const item = sweep(root).data.items.find((candidate) => candidate.id === id)!;
    expect(item.action).toContain(`kotta task settle ${id}`);
    const settled = attempt(root, ["task", "settle", id, "--reason", "The diagram landed in the same merge; nothing is outstanding."]);
    expect(settled.status, say(settled)).toBe(0);
    expect(say(settled)).toContain("Ship the exporter");

    expect(sweep(root).data.items.filter((candidate) => candidate.id === id)).toEqual([]);
    // Cleared without touching what the review said, and without leaving the tree dirty.
    expect(stored(root, id).content).toContain("Skipped the diagram");
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 120_000);

  test("the record says who settled it and when, and claims no approval", () => {
    const root = fixture("record");
    const id = closed(root, "Skipped the diagram; text only.");
    const before = stored(root, id).data;
    attempt(root, ["task", "settle", id, "--reason", "Nothing was left outstanding."]);

    const { data } = stored(root, id);
    const record = data.deviation_settled as Record<string, string>;
    expect(record.reason).toBe("Nothing was left outstanding.");
    expect(record.settled_by).toBe("cli");
    expect(Number.isFinite(Date.parse(record.settled_at))).toBe(true);
    // The receipt on the file is the human's yes to the close, untouched: settling asked nobody, so
    // it writes no approval of its own and does not restate one that was given for something else.
    expect(data.approved_by).toBe(before.approved_by);
    expect(data.approved_at).toBe(before.approved_at);
    expect(data.approval_basis).toBe(before.approval_basis);
    expect(String(before.approval_basis)).toContain("task.close");
    expect(Object.keys(record)).toEqual(["reason", "settled_by", "settled_at"]);
  }, 120_000);

  test("a task that declared no deviation cannot be settled", () => {
    const root = fixture("nothing");
    const id = closed(root, null);
    const refused = attempt(root, ["task", "settle", id, "--reason", "There was never anything to settle."]);
    expect(refused.status).not.toBe(0);
    expect(say(refused)).toContain("declared no deviation");
    expect(stored(root, id).data.deviation_settled).toBeUndefined();
  }, 120_000);

  test("a task that has not ended cannot be settled", () => {
    const root = fixture("open");
    const id = reviewed(root, "Skipped the diagram; text only.");
    const refused = attempt(root, ["task", "settle", id, "--reason", "Nothing outstanding."]);
    expect(refused.status).not.toBe(0);
    expect(say(refused)).toContain("is review");
  }, 120_000);

  test("a settled deviation is not settled twice", () => {
    const root = fixture("twice");
    const id = closed(root, "Skipped the diagram; text only.");
    expect(attempt(root, ["task", "settle", id, "--reason", "Nothing was left outstanding."]).status).toBe(0);
    const second = attempt(root, ["task", "settle", id, "--reason", "Actually the diagram is still missing."]);
    expect(second.status).not.toBe(0);
    expect(say(second)).toContain("already records a settled deviation");
    expect((stored(root, id).data.deviation_settled as Record<string, string>).reason).toBe("Nothing was left outstanding.");
  }, 120_000);

  test("a reason is required, and an empty one is not a reason", () => {
    const root = fixture("reason");
    const id = closed(root, "Skipped the diagram; text only.");
    expect(attempt(root, ["task", "settle", id]).status, "the flag itself").not.toBe(0);
    const blank = attempt(root, ["task", "settle", id, "--reason", "   "]);
    expect(blank.status).not.toBe(0);
    expect(say(blank)).toContain("--reason");
    expect(stored(root, id).data.deviation_settled).toBeUndefined();
  }, 120_000);
});
