import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Parallelism bounds how many members a batch holds at once, not how many one release may start
 * (D-01m0zhkpw7v7pq322pg5nycf1d, UC-01m0f0wn89jebbfp6rjr0fxqh1).
 *
 * The case that produced this task is the first one here: two releases with nothing finished in
 * between left four tasks active under a batch configured for two, and the report called the two
 * it had left running "waiting".
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
/** Parses the structured result, and fails naming what the command actually said. */
const json = <T,>(result: { stdout: string; stderr: string }): T => {
  const parsed = JSON.parse(say(result)) as { ok?: boolean; data?: unknown };
  if (parsed.ok === false || parsed.data === undefined) throw new Error(`command refused: ${say(result)}`);
  return parsed as T;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000wv";

interface StartResult {
  data: {
    started: string[];
    running: string[];
    waiting: string[];
    budget: { configured: number; running: number; released: number; held: number };
  };
}

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-budget-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/waved-000000wv.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Waved", "---", "",
    "## Definition", "The work is waved.", "", "## Usage", "Wave fixture.", "", "## Non-examples", "Unwaved work.", "",
  ].join("\n"));
  git(root, "add", "."); git(root, "commit", "-m", "workspace");
  return root;
}

function definedTask(root: string, title: string): string {
  const created = json<{ data: { id: string; path: string } }>(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]));
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The work is waved.")
    .replace("- Define an observable condition.", "- The work is waved.")
    .replace("- Explain how acceptance will be checked.", "- Run the budget test.");
  const source = join(mkdtempSync(join(tmpdir(), "kotta-budget-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The work is waved.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (attempt(root, ["task", "define", created.data.id, "--from", source, "--json"]).status !== 0) throw new Error("define failed");
  return created.data.id;
}

/** A batch of independent members, ready to release. */
function batchOf(root: string, titles: string[], parallelism: string): { batch: string; tasks: string[] } {
  const tasks = titles.map((title) => definedTask(root, title));
  const batch = json<{ data: { id: string } }>(attempt(root, ["batch", "new", "--title", "Wave batch", "--goal", "Ship independent slices", "--parallelism", parallelism, "--json"])).data.id;
  for (const task of tasks) attempt(root, ["batch", "add", batch, task, "--json"]);
  // Membership is control state Kotta commits itself; the index it regenerates alongside is not
  // always in that commit, and `start` refuses a dirty tree. Commit the residue and prove it gone,
  // so a fixture can never be mistaken for the behaviour under test.
  git(root, "add", "-A");
  if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", "define batch");
  expect(git(root, "status", "--porcelain"), "the fixture starts clean").toBe("");
  return { batch, tasks };
}

/**
 * One wave release.
 *
 * `batch start` writes control state after its own cleanliness check and before the first member's
 * start runs another, so the first invocation on a clean workspace refuses as dirty and leaves the
 * residue behind (F-01m0zn4hh2gd2b4dqhgdp1kb6m1). That is a defect of its own, recorded and out of
 * this task's scope; here the residue is committed and the identical command retried once, so what
 * the assertions measure is the budget and nothing else.
 */
function release(root: string): StartResult {
  const batch = readdirSync(join(root, ".kotta/process/batches")).filter((name) => name.endsWith(".md"))[0];
  const id = /^id:\s*(\S+)/m.exec(readFileSync(join(root, ".kotta/process/batches", batch), "utf8"))![1];
  for (let attempt_ = 0; attempt_ < 2; attempt_ += 1) {
    const result = attempt(root, ["batch", "start", id, "--agent", "codex", "--json"]);
    const parsed = JSON.parse(say(result)) as { ok?: boolean; data?: unknown; errors?: Array<{ message: string }> };
    if (parsed.ok !== false && parsed.data !== undefined) return parsed as StartResult;
    if (!parsed.errors?.some((error) => /Repository is dirty/.test(error.message))) throw new Error(`batch start refused: ${say(result)}`);
    git(root, "add", "-A");
    if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", "F-dp1kb6m1 residue");
  }
  throw new Error("batch start refused as dirty twice");
}

/** The same release, as the operator reads it. */
function releasePrinted(root: string): string {
  const batch = readdirSync(join(root, ".kotta/process/batches")).filter((name) => name.endsWith(".md"))[0];
  const id = /^id:\s*(\S+)/m.exec(readFileSync(join(root, ".kotta/process/batches", batch), "utf8"))![1];
  return say(attempt(root, ["batch", "start", id, "--agent", "codex"]));
}

const activeCount = (root: string) => readdirSync(join(root, ".kotta/process/tasks"))
  .filter((name) => name.endsWith(".md"))
  .filter((name) => /^status: active$/m.test(readFileSync(join(root, ".kotta/process/tasks", name), "utf8"))).length;
const claimCount = (root: string) => readdirSync(join(root, ".kotta/process/claims")).filter((name) => name.endsWith(".yaml")).length;

describe("a batch holds no more than its configured parallelism", () => {
  test("a second release with nothing finished starts nothing, and says why", () => {
    const root = fixture("budget");
    const { batch } = batchOf(root, ["Build the parser", "Expose the command", "Write the guide", "Ship the exporter"], "2");

    const first = release(root);
    expect(first.data.started).toHaveLength(2);
    expect(activeCount(root)).toBe(2);
    expect(first.data.budget).toMatchObject({ configured: 2, released: 2, held: 2 });

    // The case this task exists for: nothing finished, so nothing is released.
    const second = release(root);
    expect(second.data.started).toEqual([]);
    expect(activeCount(root), "the batch still holds exactly its parallelism").toBe(2);
    expect(claimCount(root), "and created no further claim").toBe(2);
    expect(second.data.budget).toMatchObject({ configured: 2, running: 2, released: 0, held: 2 });

    // The reader is told the budget is the reason, not left to infer it from a short list.
    const printed = releasePrinted(root);
    expect(printed).toContain("already carries 2 of its 2");
  }, 180_000);

  test("work the batch is carrying is reported as running, never as waiting", () => {
    const root = fixture("running");
    const { batch, tasks } = batchOf(root, ["Build the parser", "Expose the command", "Write the guide"], "2");
    const first = release(root);
    const started = first.data.started;

    const second = release(root);
    expect(second.data.running.sort()).toEqual([...started].sort());
    // The member the batch never released is the only one waiting.
    expect(second.data.waiting).toEqual(tasks.filter((task) => !started.includes(task)));
    for (const task of started) expect(second.data.waiting).not.toContain(task);

    const printed = releasePrinted(root);
    expect(printed).toContain("Running:");
    expect(printed).toContain("Waiting:");
  }, 180_000);

  test("a batch configured for one still releases one, and releases the next only when the first ends", () => {
    const root = fixture("one");
    const { batch } = batchOf(root, ["Build the parser", "Expose the command"], "1");
    const first = release(root);
    expect(first.data.started).toHaveLength(1);

    expect(release(root).data.started).toEqual([]);
    expect(activeCount(root)).toBe(1);

    // Releasing the claim returns the member to defined, and the budget frees with it.
    expect(attempt(root, ["claim", "release", first.data.started[0], "--force", "--json"]).status).toBe(0);
    const next = release(root);
    expect(next.data.started).toHaveLength(1);
  }, 180_000);

  test("a release held back by a dependency does not blame the budget", () => {
    const root = fixture("blocked");
    const { batch, tasks } = batchOf(root, ["Build the parser", "Expose the command"], "2");
    // The second member depends on the first, so only one is ever eligible.
    const second = readdirSync(join(root, ".kotta/process/tasks")).map((name) => join(root, ".kotta/process/tasks", name))
      .find((path) => readFileSync(path, "utf8").includes(tasks[1]))!;
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", `depends_on:\n  - ${tasks[0]}`));
    git(root, "add", "-A"); git(root, "commit", "-m", "depend");

    const released = release(root);
    expect(released.data.started).toEqual([tasks[0]]);
    // One eligible, one released, nothing held: the blocked member is waiting on its dependency,
    // not on the budget, and the report must not say otherwise.
    expect(released.data.budget).toMatchObject({ configured: 2, running: 0, released: 1, held: 0 });
    expect(released.data.waiting).toEqual([tasks[1]]);

    const printed = releasePrinted(root);
    expect(printed).toContain("Waiting:");
    expect(printed).not.toContain("already carries");
  }, 180_000);
});
