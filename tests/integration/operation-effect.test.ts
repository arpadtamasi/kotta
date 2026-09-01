import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import { expandOperations } from "../../src/core/operations.js";

/**
 * A read is proved by running it (BR-01m0nsyasfnjc9s4073r8zb33j).
 *
 * The rule says a declaration naming an operation for what it reports must say so when it also
 * writes. A registry field alone would only move the claim: `validate` and `batch validate` both
 * promoted a backlog batch and committed under summaries that said they validate. So every
 * `reads` declaration is run against a populated workspace, and the workspace and the commit are
 * compared byte for byte — a write that avoids `git status` by committing is caught by HEAD.
 */

const cli = resolve("dist/cli/index.js");
let repository: string;
let ids: { task: string; observation: string; batch: string; decision: string };

const run = (args: string[]) => spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (...args: string[]) => execFileSync("git", args, { cwd: repository, encoding: "utf8" });
const json = (args: string[]) => JSON.parse(say(run([...args, "--json"]))) as { data: Record<string, unknown> };

const SPEC_ID = "GT-01m0c00000000000000000000e";

/** Every file under the workspace with its bytes, so a change anywhere is visible. */
function snapshot(): Array<[string, string]> {
  const root = join(repository, ".kotta");
  const found: Array<[string, string]> = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current).sort()) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else found.push([relative(root, path).split(sep).join("/"), readFileSync(path, "utf8")]);
    }
  };
  walk(root);
  return found;
}

beforeAll(() => {
  repository = mkdtempSync(join(tmpdir(), "kotta-operation-effect-"));
  git("init", "-b", "main");
  git("config", "user.name", "Kotta Test");
  git("config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  git("add", ".");
  git("commit", "-m", "initial");
  if (run(["init", "--json"]).status !== 0) throw new Error("init failed");

  execFileSync("mkdir", ["-p", join(repository, ".kotta/spec/glossary-terms")]);
  writeFileSync(join(repository, ".kotta/spec/glossary-terms/effect-0000000e.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Effect", "---", "",
    "## Definition", "The operation reads.", "", "## Usage", "Effect fixture.", "", "## Non-examples", "A silent commit.", "",
  ].join("\n"));
  git("add", ".");
  git("commit", "-m", "workspace");

  const task = json(["task", "new", "--title", "Ship the exporter", "--type", "feature"]).data as { id: string; path: string };
  const body = readFileSync(task.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The operation reads.")
    .replace("- Define an observable condition.", "- The operation reads.")
    .replace("- Explain how acceptance will be checked.", "- Run the effect test.");
  const definition = join(mkdtempSync(join(tmpdir(), "kotta-effect-def-")), "definition.md");
  writeFileSync(definition, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The operation reads.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (run(["task", "define", task.id, "--from", definition]).status !== 0) throw new Error("define failed");

  const observation = json(["observation", "new", "--title", "The importer logs nothing", "--type", "bug", "--evidence", "Seen in the fixture."]).data as { id: string };
  const batch = json(["batch", "new", "--title", "The first wave"]).data as { id: string };
  if (run(["batch", "add", batch.id, task.id]).status !== 0) throw new Error("batch add failed");

  const draft = join(mkdtempSync(join(tmpdir(), "kotta-effect-dec-")), "decision.md");
  writeFileSync(draft, [
    "---", "title: A read is proved by running it", "---", "",
    "## Context", "A declaration can say anything.", "",
    "## Decision", "It is run.", "",
    "## Consequences", "A silent commit is caught.", "",
  ].join("\n"));
  const created = run(["decision", "create", "--from", draft, "--approve", "--json"]);
  if (created.status !== 0) throw new Error(say(created));

  // The baseline has to be clean, or every case below fails on dirt it did not create.
  git("add", "-A");
  if (git("status", "--porcelain")) git("commit", "-m", "fixture");

  ids = {
    task: task.id,
    observation: observation.id,
    batch: batch.id,
    decision: String((JSON.parse(created.stdout) as { data: { id: string } }).data.id),
  };
}, 180_000);

/**
 * The arguments each read-declared command needs. A command missing from here is a failure, not a
 * skip: the walk below asserts that the map covers exactly the declared reads, so an operation
 * added tomorrow cannot slip past by being unrunnable.
 */
function argumentsFor(command: string): string[] | null {
  const named: Record<string, string[]> = {
    "task show": [ids.task], "task validate": [ids.task], "task brief": [ids.task],
    "observation show": [ids.observation], "observation validate": [ids.observation],
    "batch show": [ids.batch], "batch status": [ids.batch],
    "decision show": [ids.decision],
    "questions": [],
  };
  if (command in named) return named[command];
  // Argumentless reports, and the entity listings, take nothing.
  if (["status", "validate", "sweep", "gap", "doctor", "claim list"].includes(command)) return [];
  if (command.endsWith(" list")) return [];
  return null;
}

describe("an operation summarised as a report is proved not to write", () => {
  const reads = expandOperations()
    .filter((operation) => operation.effect === "reads" && operation.cli)
    .map((operation) => operation.cli!.join(" "))
    .sort();

  test("every read-declared command has arguments here, so none can be skipped quietly", () => {
    expect(reads.filter((command) => argumentsFor(command) === null)).toEqual([]);
  });

  test.each(reads)("%s leaves the workspace and the commit exactly as it found them", (command) => {
    const before = snapshot();
    const head = git("rev-parse", "HEAD").trim();

    const result = run([...command.split(" "), ...argumentsFor(command)!]);
    // The exit code is not the subject: `gap` and `sweep` exit non-zero when they found something.
    // What matters is that running it changed nothing.
    expect(say(result), `${command} produced no output at all`).not.toBe("");

    expect(snapshot(), `${command} changed the workspace`).toEqual(before);
    expect(git("rev-parse", "HEAD").trim(), `${command} committed`).toBe(head);
    expect(git("status", "--porcelain"), `${command} left the tree dirty`).toBe("");
  }, 60_000);

  test("the fixture can catch a write: validate, which declares one, does commit", () => {
    // The proof that the comparison is not vacuous. `validate` promotes the backlog batch to
    // defined and commits — the exact behaviour whose summary used to hide it.
    const head = git("rev-parse", "HEAD").trim();
    expect(run(["validate"]).status).toBe(0);

    expect(git("rev-parse", "HEAD").trim(), "validate committed, as its summary now says").not.toBe(head);
    expect(json(["batch", "show", ids.batch]).data.state).toBe("defined");
  }, 60_000);
});
