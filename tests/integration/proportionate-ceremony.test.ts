import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";

/**
 * Ceremony is constant, and the numbers that say so are counted
 * (QA-01m0fp2hdkq55yrx9qr5t8pweh, D-01m0zxbm2k60g0apj2f5ke6pb8).
 *
 * The quality attribute states three measures and nothing had ever measured them. A gate is not
 * counted from the documentation here: every transition on the path is first invoked without
 * approval, and a gate is a transition that refuses to proceed without it. That is what a gate is,
 * so that is what is counted.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000cm";
const APPROVAL_REFUSAL = /approval is required/i;

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-ceremony-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/ceremonious-00000cm.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Ceremonious", "---", "",
    "## Definition", "The work is accepted once.", "", "## Usage", "Ceremony fixture.", "", "## Non-examples", "Work accepted twice.", "",
  ].join("\n"));
  git(root, "add", "."); git(root, "commit", "-m", "workspace");
  return root;
}

describe("a spec-covered task crosses exactly one human gate", () => {
  test("the whole path is walked, every step is offered without approval first, and one refuses", () => {
    const root = fixture();
    /** Every command invoked to carry the task, in order, and whether it needed approval. */
    const steps: Array<{ step: string; gated: boolean }> = [];

    // 1 — capture.
    const created = JSON.parse(say(attempt(root, ["task", "new", "--title", "Ship the exporter", "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
    const id = created.data.id;
    steps.push({ step: "task new", gated: false });

    // 2 — define.
    const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
      .replace("Describe the observable outcome.", "The work is accepted once.")
      .replace("- Define an observable condition.", "- The work is accepted once.")
      .replace("- Explain how acceptance will be checked.", "- Run the ceremony test.");
    const source = join(mkdtempSync(join(tmpdir(), "kotta-ceremony-def-")), "definition.md");
    writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The work is accepted once.":\n    - ${SPEC_ID}\n---\n\n${body}`);
    expect(attempt(root, ["task", "define", id, "--from", source, "--json"]).status).toBe(0);
    steps.push({ step: "task define", gated: false });

    // 3 — execute. The task is now in front of an agent.
    const started = attempt(root, ["task", "start", id, "--agent", "codex", "--json"]);
    expect(started.status).toBe(0);
    steps.push({ step: "task start", gated: false });
    const reachedTheAgent = steps.length;

    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");

    // 4 — submit. Offered without approval, and it does not ask for any.
    const reviewed = attempt(worktree, ["task", "review", id, "--evidence", "The work is accepted once.=delivered and read", "--json"]);
    expect(say(reviewed)).not.toMatch(APPROVAL_REFUSAL);
    expect(reviewed.status).toBe(0);
    steps.push({ step: "task review", gated: false });

    git(root, "merge", "--no-ff", `feat/${id}-ship-the-exporter`, "-m", "merge");

    // 5 — close. Offered without approval first: this is the one that refuses.
    const unapproved = attempt(root, ["task", "close", id, "--json"]);
    expect(unapproved.status, "close without approval must refuse").not.toBe(0);
    expect(say(unapproved)).toMatch(APPROVAL_REFUSAL);
    expect(attempt(root, ["task", "close", id, "--approve", "--json"]).status).toBe(0);
    steps.push({ step: "task close", gated: true });

    // The measure: exactly one human gate on the whole path.
    const gates = steps.filter(({ gated }) => gated);
    expect(gates.map(({ step }) => step), "exactly one human gate, at close").toEqual(["task close"]);
    // And at most three steps from captured intent to the executing agent.
    expect(reachedTheAgent, `captured intent reached an agent in ${reachedTheAgent} steps: ${steps.slice(0, reachedTheAgent).map(({ step }) => step).join(", ")}`).toBeLessThanOrEqual(3);

    // Every gated transition records who approved, when, and on what basis.
    const stored = matter(readFileSync(join(root, ".kotta/process/tasks", readdirSync(join(root, ".kotta/process/tasks")).find((name) => name.endsWith(".md"))!), "utf8")).data;
    expect(stored.status).toBe("done");
    expect(stored.approved_by, "the receipt names who").toBeTruthy();
    expect(stored.approved_at, "the receipt names when").toBeTruthy();
    expect(String(stored.approval_basis), "the receipt names the basis").toContain("task.close");
  }, 180_000);

  test("retiring a task is the same single gate, taken by a different exit", () => {
    const root = fixture();
    const created = JSON.parse(say(attempt(root, ["task", "new", "--title", "Ship the importer", "--type", "feature", "--json"]))) as { data: { id: string } };
    const id = created.data.id;
    // task new leaves its control-state residue behind, and cancel checks the tree before it checks
    // approval, so the gate is only reachable from a clean one.
    git(root, "add", "-A"); git(root, "commit", "-m", "capture");

    const unapproved = attempt(root, ["task", "cancel", id, "--resolution", "cancelled", "--reason", "The work has no object.", "--json"]);
    expect(unapproved.status, "cancel without approval must refuse").not.toBe(0);
    expect(say(unapproved)).toMatch(APPROVAL_REFUSAL);

    const cancelled = attempt(root, ["task", "cancel", id, "--resolution", "cancelled", "--reason", "The work has no object.", "--approve", "--json"]);
    expect(cancelled.status, say(cancelled)).toBe(0);
    const stored = matter(readFileSync(join(root, ".kotta/process/tasks", readdirSync(join(root, ".kotta/process/tasks"))[0]), "utf8")).data;
    expect(stored.approval_basis).toContain("task.cancel");
  }, 180_000);
});

describe("this workspace's own record keeps the promise", () => {
  interface Event { kind: string; state?: string; phase?: string; action?: string; entity: string; created_at: string; summary?: string }

  const events: Event[] = readdirSync(resolve(".kotta/process/events"))
    .flatMap((entity) => {
      const directory = resolve(".kotta/process/events", entity);
      return readdirSync(directory).filter((name) => name.endsWith(".json"))
        .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")) as Event);
    });

  /** A task ending, to the millisecond. `updated_at` is a date, and a date cannot separate the day
   *  a mechanism landed from the endings that happened earlier the same day. */
  const endings = events.filter((event) => event.kind === "lifecycle" && event.state === "done" && /^[TO]-/.test(event.entity));
  const applied = (action: string) => events.filter((event) => event.kind === "approval" && event.phase === "applied" && event.action === action);

  test("no task has ended without an approval since that exit first recorded one", () => {
    expect(endings.length, "this workspace has ended tasks").toBeGreaterThan(0);
    const unreceipted: string[] = [];
    for (const action of ["task.close", "task.cancel"]) {
      const receipts = applied(action);
      expect(receipts.length, `${action} has recorded approvals`).toBeGreaterThan(0);
      // Each exit carries its own boundary, derived from the record rather than written down here:
      // close began recording months before cancel did, and one date for both would call the
      // earlier history a breach.
      const since = receipts.map((event) => event.created_at).sort()[0];
      const approved = new Set(receipts.map((event) => event.entity));
      unreceipted.push(...endings
        .filter((event) => event.created_at >= since && !approved.has(event.entity))
        .filter((event) => !events.some((other) => other.kind === "approval" && other.phase === "applied" && other.entity === event.entity))
        .map((event) => `${event.entity} ended ${event.created_at} without ${action}`));
    }
    expect([...new Set(unreceipted)], "every task ending after its exit began recording carries an approval").toEqual([]);
  });

  test("what the measure does not count says so, rather than being filtered away", () => {
    // A batch completes when its last member does — the documented path, and not a gate the
    // quality attribute counts. `batch.close` has never taken an approval in this workspace, which
    // is that sentence showing up in the record rather than a promise being skipped.
    const batchEndings = events.filter((event) => event.kind === "lifecycle" && event.state === "done" && /^P-/.test(event.entity));
    expect(batchEndings.length).toBeGreaterThan(0);
    expect(batchEndings.every((event) => /completed/i.test(String(event.summary ?? "")))).toBe(true);
    expect(applied("batch.close")).toEqual([]);
  });
});
