import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { validateSpecWorkspace } from "../../src/spec/registry.js";

/**
 * A citation resolves, or it is a broken reference (UC-01m0f0wn89ny7vx515ke3ksnra).
 *
 * The edge checks read frontmatter. An id written into a node's prose was read by nobody, so a
 * mistyped business-rule id landed green on 2026-08-28 and was found only by a person re-reading
 * the sentence — a reference that resolves to nothing is worse than no reference, because it reads
 * as an answer.
 */

const cli = resolve("dist/cli/index.js");
let repository: string;
let skillsHome: string;

function invoke(args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, KOTTA_SKILLS_HOME: skillsHome },
  });
}

/** A report command exits non-zero exactly when it found something; the JSON is the answer either way. */
function report(args: string[]): { ok: boolean; errors?: Array<{ code: string; message: string }> } {
  const result = invoke(args);
  if (!result.stdout.trim()) throw new Error(result.stderr);
  return JSON.parse(result.stdout);
}

const QUALITY_ID = "QA-01m0c000000000000000000001";
const GOAL_ID = "G-01m0c000000000000000000002";
const EXAMPLE_ID = "EX-01m0c000000000000000000004";

/**
 * Three nodes that answer each other's required edges, so the fixture validates clean. Only then
 * does an exit code say something about a citation rather than about the fixture.
 */
function writeQuality(): void {
  writeFileSync(join(repository, ".kotta/spec/quality-attributes/brief-latency-qa000001.md"), [
    "---", `id: ${QUALITY_ID}`, "form: quality-attribute", "title: Brief production stays under a second", "---", "",
    "## Source", "An executing agent.", "",
    "## Stimulus", "It asks for the execution brief.", "",
    "## Environment", "A workspace holding a hundred specification nodes.", "",
    "## Artifact", "The brief command.", "",
    "## Response", "The brief is returned with every referenced node inlined.", "",
    "## Measure", "Under one second at the 95th percentile.", "",
  ].join("\n"));
}

/** The goal, with whatever its Context paragraph says. */
function writeGoal(context: string): void {
  writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), [
    "---", `id: ${GOAL_ID}`, "form: goal", "title: The specification governs execution",
    `measured_by: [${QUALITY_ID}]`, "---", "",
    "## Outcome", "The executing agent sees the specification its task rests on.", "",
    "## Context", context, "",
    "## Baseline and target", "Baseline zero readers; target every referenced node in the brief.", "",
  ].join("\n"));
}

function writeExample(): void {
  writeFileSync(join(repository, ".kotta/spec/examples/brief-is-fast-ex000004.md"), [
    "---", `id: ${EXAMPLE_ID}`, "form: example", "title: Brief production is fast", `subjects: [${QUALITY_ID}]`, "---", "",
    "## Given", "A workspace with specification nodes.", "",
    "## When", "The executing agent asks for a brief.", "",
    "## Then", "The brief arrives under the accepted latency threshold.", "",
  ].join("\n"));
}

const dangling = (args = ["validate"]) =>
  (report(args).errors ?? []).filter((error) => error.code === "SPEC_PROSE_DANGLING_CITATION");

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "kotta-prose-citation-"));
  skillsHome = mkdtempSync(join(tmpdir(), "kotta-prose-citation-skills-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: repository });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: repository });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repository });
  if (invoke(["init"]).status !== 0) throw new Error("init failed");
  writeQuality();
  writeGoal("Nothing in Kotta read a specification node before.");
  writeExample();
  // The premise every case below rests on: without a broken citation, this workspace validates.
  if (invoke(["validate"]).status !== 0) throw new Error("the fixture does not validate clean");
});

describe("a specification id cited in prose resolves, or validation says so", () => {
  test("an id naming nothing fails validation, with the file, the id and the section", () => {
    const missing = "BR-01m0czzzzzzzzzzzzzzzzzzzzz";
    writeGoal(`Nothing read a node before, as ${missing} explains.`);

    const result = invoke(["validate"]);
    expect(result.status, "a broken citation refuses the workspace").not.toBe(0);
    const issue = dangling()[0];
    expect(issue?.message).toContain("spec-governs-g0000002.md");
    expect(issue?.message).toContain(missing);
    expect(issue?.message, "where it stands, so it can be found without a search").toContain("Context");
    expect(issue?.message).toContain("neither a specification node nor a decision");
  });

  test("a citation that resolves is silent, including a node citing itself", () => {
    writeGoal(`This is measured by ${QUALITY_ID}, worked through in ${EXAMPLE_ID}, and this goal is ${GOAL_ID}.`);

    expect(dangling()).toEqual([]);
    expect(invoke(["validate"]).status).toBe(0);
  });

  test("a decision cited in prose resolves against the decision records, in either id form", () => {
    const draft = join(repository, "decision.md");
    writeFileSync(draft, [
      "---", "title: Citations are checked wherever they stand", "---", "",
      "## Context", "Prose citations were read by nobody.", "",
      "## Decision", "They are read.", "",
      "## Consequences", "A mistyped id refuses the workspace.", "",
    ].join("\n"));
    const created = invoke(["decision", "create", "--from", draft, "--approve"]);
    expect(created.status, created.stderr).toBe(0);
    const id = String((JSON.parse(created.stdout) as { data: { id: string } }).data.id);

    writeGoal(`The reasoning is recorded in ${id}.`);
    expect(dangling()).toEqual([]);

    // And the same sentence with one character wrong is not silent.
    writeGoal(`The reasoning is recorded in ${id.slice(0, -1)}${id.endsWith("0") ? "1" : "0"}.`);
    expect(dangling()).toHaveLength(1);
  });

  test("what counts as a citation comes from the registry, not from a list in the code", () => {
    writeFileSync(join(repository, ".kotta/spec/forms/risk.yaml"), [
      "id: risk", "version: 1", "directory: risks", "canonical_source: Project",
      "description: A named risk with an owner.",
      "identity:", "  prefix: RK", '  format: "<prefix>-<26-character lowercase Crockford ULID>"', '  filename: "<slug>-<last 8 id characters>.md"',
      "required_fields:", "  frontmatter: [id, form, title]", "  body_headings: [Risk, Mitigation]",
      "required_edges: []",
      "recognition_signals:", "  - Something might go wrong.", "",
    ].join("\n"));
    if (invoke(["sync"]).status !== 0) throw new Error("sync failed");

    // A prefix no TypeScript file has ever heard of, cited an hour after the form was registered.
    const missing = "RK-01m0czzzzzzzzzzzzzzzzzzzzz";
    writeGoal(`The risk is ${missing}.`);
    expect(dangling()[0]?.message).toContain(missing);

    // And a registered form's node resolves under that same reading.
    writeFileSync(join(repository, ".kotta/spec/risks/registry-drift-rk000001.md"), [
      "---", "id: RK-01m0c000000000000000000003", "form: risk", "title: The registry drifts", "---", "",
      "## Risk", "The forms and the nodes disagree.", "",
      "## Mitigation", "Validation reads both.", "",
    ].join("\n"));
    writeGoal("The risk is RK-01m0c000000000000000000003.");
    expect(dangling()).toEqual([]);
  });

  test("a longer prefix is never read as a shorter one with a stray character", () => {
    // EX- and E- are both registered. Reading `EX-…` as an `E-` citation would report a resolvable
    // example id as missing, which is the failure mode that makes a checker get switched off.
    writeGoal(`Worked through in ${EXAMPLE_ID}.`);
    expect(dangling()).toEqual([]);

    // And the entity prefix it shadows is read on its own terms, not as a truncated example.
    writeGoal("Worked through in E-01m0czzzzzzzzzzzzzzzzzzzzz.");
    expect(dangling()[0]?.message).toContain("E-01m0czzzzzzzzzzzzzzzzzzzzz");
  });

  test("Kotta's own specification passes the check it now runs", () => {
    // The five nodes that cite decision records in prose are the reason resolving reads both
    // namespaces; this asserts against the shipped workspace, not a fixture.
    const issues = validateSpecWorkspace(resolve("."))
      .filter((issue) => issue.code === "SPEC_PROSE_DANGLING_CITATION");
    expect(issues.map((issue) => issue.message)).toEqual([]);
  });

  test("a citation inside a fenced block is still a citation", () => {
    const missing = "GT-01m0czzzzzzzzzzzzzzzzzzzzz";
    writeGoal(["Shown below.", "", "```text", `see ${missing}`, "```"].join("\n"));

    // A fence is a place a reader looks, so it is not a place to hide a broken reference.
    expect(dangling()[0]?.message).toContain(missing);
  });
});
