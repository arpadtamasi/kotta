import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A service that writes canonical state commits it (BR-01m0f0wn89r5np2yce79y2pctq,
 * UC-01m0f0wn89jebbfp6rjr0fxqh1).
 *
 * `startBatch` validates before it checks the checkout, and validation promotes a backlog batch to
 * defined. That write went uncommitted, so `assertClean` found it and told the operator their
 * repository was dirty — about a change Kotta had just made. Every batch mutation is asserted here
 * from the outside: the workspace is as clean after it as before.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const dirty = (root: string) => git(root, "status", "--porcelain").trim();

const SPEC_ID = "GT-01m0c0000000000000000000bc";

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-batchstate-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/committed-00000bc.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Committed", "---", "",
    "## Definition", "The state is committed.", "", "## Usage", "Control-state fixture.", "", "## Non-examples", "An uncommitted write.", "",
  ].join("\n"));
  git(root, "add", "."); git(root, "commit", "-m", "workspace");
  return root;
}

function definedTask(root: string, title: string): string {
  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The state is committed.")
    .replace("- Define an observable condition.", "- The state is committed.")
    .replace("- Explain how acceptance will be checked.", "- Run the control-state test.");
  const source = join(mkdtempSync(join(tmpdir(), "kotta-batchstate-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The state is committed.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (attempt(root, ["task", "define", created.data.id, "--from", source, "--json"]).status !== 0) throw new Error("define failed");
  return created.data.id;
}

describe("every batch mutation commits what it wrote", () => {
  test("new, add, remove and validate each leave the workspace as clean as they found it", () => {
    const root = fixture();
    const first = definedTask(root, "Build the parser");
    const second = definedTask(root, "Expose the command");
    expect(dirty(root), "the fixture starts clean").toBe("");

    const batch = JSON.parse(say(attempt(root, ["batch", "new", "--title", "Parser slice", "--goal", "Ship a slice", "--json"]))) as { data: { id: string } };
    expect(dirty(root), "batch new committed what it wrote").toBe("");

    expect(attempt(root, ["batch", "add", batch.data.id, first, "--json"]).status).toBe(0);
    expect(dirty(root), "batch add committed what it wrote").toBe("");

    expect(attempt(root, ["batch", "add", batch.data.id, second, "--json"]).status).toBe(0);
    expect(attempt(root, ["batch", "remove", batch.data.id, second, "--json"]).status).toBe(0);
    expect(dirty(root), "batch remove committed what it wrote").toBe("");

    // Validation promotes a backlog batch to defined — a write, and the one that caused the defect.
    const validated = JSON.parse(say(attempt(root, ["batch", "validate", batch.data.id, "--json"]))) as { data: { state: string } };
    expect(validated.data.state).toBe("defined");
    expect(dirty(root), "the defined promotion committed what it wrote").toBe("");
  }, 180_000);

  test("a batch releases its first wave on the first invocation, from a clean workspace", () => {
    const root = fixture();
    const task = definedTask(root, "Build the parser");
    const batch = JSON.parse(say(attempt(root, ["batch", "new", "--title", "Parser slice", "--goal", "Ship a slice", "--json"]))) as { data: { id: string } };
    attempt(root, ["batch", "add", batch.data.id, task, "--json"]);
    expect(dirty(root)).toBe("");

    const started = attempt(root, ["batch", "start", batch.data.id, "--agent", "codex", "--json"]);
    // The defect: this refused as dirty, and the identical command succeeded on the second run.
    expect(started.status, say(started)).toBe(0);
    expect(JSON.parse(say(started)).data.started).toEqual([task]);
  }, 180_000);

  test("no refusal blames the operator for a change Kotta made", () => {
    const root = fixture();
    const task = definedTask(root, "Build the parser");
    const batch = JSON.parse(say(attempt(root, ["batch", "new", "--title", "Parser slice", "--goal", "Ship a slice", "--json"]))) as { data: { id: string } };
    attempt(root, ["batch", "add", batch.data.id, task, "--json"]);

    // A dirty tree the operator actually made is still refused, and named as theirs.
    writeFileSync(join(root, "scratch.md"), "# mine\n");
    const refused = attempt(root, ["batch", "start", batch.data.id, "--agent", "codex", "--json"]);
    expect(refused.status).not.toBe(0);
    expect(say(refused)).toMatch(/dirty/i);
    // And what it refused over is visible to them, not a write Kotta had just made.
    expect(dirty(root)).toBe("?? scratch.md");
  }, 180_000);
});
