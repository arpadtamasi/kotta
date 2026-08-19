import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * The two namespaces meet in exactly one place: a contract may name the specification it rests on.
 * Everything here holds that meeting point to its two promises — the reference resolves or the
 * command refuses, and what resolves reaches the executing agent's brief — and to the one direction
 * it is allowed to run in.
 */

const cli = resolve("dist/cli/index.js");
let repository: string;
let skillsHome: string;

function run(args: string[]): { ok: boolean; data: Record<string, unknown>; errors?: Array<{ code: string; message: string }> } {
  const result = invoke(args);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout);
}

/** A report command exits non-zero exactly when it found something; the JSON is the answer either way. */
function report(args: string[]): { ok: boolean; data: Record<string, unknown>; errors?: Array<{ code: string; message: string }> } {
  const result = invoke(args);
  if (!result.stdout.trim()) throw new Error(result.stderr);
  return JSON.parse(result.stdout);
}

function invoke(args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, KOTTA_SKILLS_HOME: skillsHome },
  });
}

const GOAL_ID = "G-01m0c000000000000000000002";
const QUALITY_ID = "QA-01m0c000000000000000000001";

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

function writeGoal(extraFrontmatter: string[] = [], measuredBy = `[${QUALITY_ID}]`): void {
  writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), [
    "---", `id: ${GOAL_ID}`, "form: goal", "title: The specification governs execution",
    `measured_by: ${measuredBy}`, ...extraFrontmatter, "---", "",
    "## Outcome", "The executing agent sees the specification its contract rests on.", "",
    "## Context", "Nothing in Kotta read a specification node before.", "",
    "## Baseline and target", "Baseline zero readers; target every referenced node in the brief.", "",
  ].join("\n"));
}

const BODY = [
  "## Outcome", "The brief inlines every referenced node.", "",
  "## Scope", "One field and one resolver.", "",
  "## Non-goals", "No new surface.", "",
  "## Acceptance", "- The brief contains the node text.", "",
  "## Verification", "- Read the brief.", "",
  "## Constraints", "None.", "",
  "## Open decisions", "None.", "",
  "## Execution notes", "None.", "",
].join("\n");

function defineWith(spec: string[]): { id: string; result: ReturnType<typeof invoke> } {
  const id = String((run(["contract", "new", "--title", "Brief carries the specification", "--type", "feature"]).data as { id: string }).id);
  const definition = join(repository, "definition.md");
  writeFileSync(definition, `---\nspec:\n${spec.map((entry) => `  - ${entry}`).join("\n")}\n---\n\n${BODY}`);
  return { id, result: invoke(["contract", "define", id, "--from", definition]) };
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "kotta-spec-reference-"));
  skillsHome = mkdtempSync(join(tmpdir(), "kotta-spec-reference-skills-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: repository });
  run(["init"]);
  writeQuality();
  writeGoal();
});

describe("a contract names the specification it rests on", () => {
  test("a resolvable reference is accepted, and validation agrees (A1, A2)", () => {
    const { id, result } = defineWith([GOAL_ID, QUALITY_ID]);
    expect(result.status, result.stderr).toBe(0);

    const validated = report(["contract", "validate", id]);
    expect(validated.ok).toBe(true);
    expect(validated.errors ?? []).toEqual([]);
  });

  test("the field may be left empty, and the whole lifecycle still runs (A1)", () => {
    const { id, result } = defineWith([]);
    expect(result.status, result.stderr).toBe(0);
    expect(report(["contract", "validate", id]).ok).toBe(true);
    expect(run(["contract", "brief", id]).data.spec).toEqual([]);
  });

  test("an unresolvable reference is refused by name, at definition and at validation (A2)", () => {
    const { result } = defineWith([`${GOAL_ID}`, "G-01m0czzzzzzzzzzzzzzzzzzzzz"]);
    expect(result.status).toBe(1);
    const said = `${result.stdout}${result.stderr}`;
    expect(said).toContain("does not exist");
    expect(said).toContain("G-01m0czzzzzzzzzzzzzzzzzzzzz");
  });

  test("a node deleted after definition surfaces at validation rather than silently (A2)", () => {
    const { id } = defineWith([GOAL_ID]);
    execFileSync("rm", [join(repository, ".kotta/spec/goals/spec-governs-g0000002.md")]);

    const validated = report(["contract", "validate", id]);
    expect(validated.ok).toBe(false);
    expect(validated.errors?.map((error) => error.code)).toContain("SPEC_NOT_FOUND");
  });

  test("the brief carries every referenced node's text, and names any it could not find (A3)", () => {
    const { id } = defineWith([GOAL_ID, QUALITY_ID]);
    const brief = run(["contract", "brief", id]).data as { spec: string[]; missingSpec: string[]; brief: string; sections: Array<{ name: string }> };

    expect(brief.spec).toEqual([GOAL_ID, QUALITY_ID]);
    expect(brief.missingSpec).toEqual([]);
    // Rule 8 makes the brief the executor's whole world; the node text has to be inside it.
    expect(brief.brief).toContain("The executing agent sees the specification its contract rests on.");
    expect(brief.brief).toContain("Under one second at the 95th percentile.");
    expect(brief.sections.map((section) => section.name)).toEqual(expect.arrayContaining([`spec ${GOAL_ID}`, `spec ${QUALITY_ID}`]));

    execFileSync("rm", [join(repository, ".kotta/spec/goals/spec-governs-g0000002.md")]);
    const after = run(["contract", "brief", id]).data as { missingSpec: string[]; brief: string };
    expect(after.missingSpec).toEqual([GOAL_ID]);
    expect(after.brief).toContain("Missing specification");
  });
});

describe("the specification is measured against its own form", () => {
  test("a complete workspace validates and counts its nodes", () => {
    const validated = report(["validate"]);
    expect(validated.ok).toBe(true);
    expect(validated.data.specNodes).toBe(2);
  });

  test("a missing required frontmatter field is named with its file and form (A4)", () => {
    writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"),
      readFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), "utf8").replace("title: The specification governs execution", ""));

    const validated = report(["validate"]);
    expect(validated.ok).toBe(false);
    const issue = validated.errors?.find((error) => error.code === "SPEC_NODE_MISSING_FIELD");
    expect(issue?.message).toContain("'title'");
    expect(issue?.message).toContain("goal");
  });

  test("a missing required body heading is named (A4)", () => {
    writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"),
      readFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), "utf8").replace("## Baseline and target", "## Notes"));

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_MISSING_SECTION");
    expect(issue?.message).toContain("Baseline and target");
  });

  test("an edge answered fewer times than its minimum is named (A4)", () => {
    writeGoal([], "[]");

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_MISSING_EDGE");
    expect(issue?.message).toContain("measurement");
    expect(issue?.message).toContain("measured_by");
  });

  test("an edge pointing at nothing, and one pointing at the wrong form, are told apart (A4)", () => {
    writeGoal([], "[QA-01m0czzzzzzzzzzzzzzzzzzzzz]");
    expect(report(["validate"]).errors?.map((error) => error.code)).toContain("SPEC_NODE_DANGLING_EDGE");

    writeGoal([], `[${GOAL_ID}]`);
    const wrong = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_WRONG_TARGET");
    expect(wrong?.message).toContain("is a goal");
  });

  test("a project-added form participates without a code change (A5)", () => {
    writeFileSync(join(repository, ".kotta/spec/forms/risk.yaml"), [
      "id: risk", "version: 1", "directory: risks", "canonical_source: Project",
      "description: A named risk with an owner.",
      "identity:", "  prefix: RK", '  format: "<prefix>-<26-character lowercase Crockford ULID>"', '  filename: "<slug>-<last 8 id characters>.md"',
      "required_fields:", "  frontmatter: [id, form, title, owner]", "  body_headings: [Risk, Mitigation]",
      "required_edges: []",
      "recognition_signals:", "  - Something might go wrong.", "",
    ].join("\n"));
    run(["sync"]);
    writeFileSync(join(repository, ".kotta/spec/risks/registry-drift-rk000001.md"), [
      "---", "id: RK-01m0c000000000000000000003", "form: risk", "title: The registry drifts", "---", "",
      "## Risk", "The forms and the nodes disagree.", "",
    ].join("\n"));

    const errors = report(["validate"]).errors ?? [];
    expect(errors.map((error) => error.message).join("\n")).toContain("'owner'");
    expect(errors.map((error) => error.message).join("\n")).toContain("Mitigation");
  });
});

describe("the direction only runs one way", () => {
  test("a node naming a contract is refused under any field name (A6)", () => {
    const { id } = defineWith([GOAL_ID]);
    writeGoal([`delivered_by: ${id}`]);

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_REFERENCES_CONTRACT");
    expect(issue?.message).toContain(id);
    expect(issue?.message).toContain("delivered_by");
    expect(issue?.message).toContain("contracts reference specification");
  });

  test("a form whose edge targets a contract is refused too (A6)", () => {
    writeFileSync(join(repository, ".kotta/spec/forms/goal.yaml"),
      readFileSync(join(repository, ".kotta/spec/forms/goal.yaml"), "utf8")
        .replace("target_forms: [example, quality-attribute]", "target_forms: [contract]"));

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_REFERENCES_CONTRACT");
    expect(issue?.message).toContain("targets 'contract'");
  });
});
