import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * The specification is measured against its own form: the registry declares the required fields,
 * headings and edges, and `kotta validate` names every part a node leaves unanswered with the
 * form's own question. A project-added form participates with nothing compiled in.
 */

const cli = resolve("dist/cli/index.js");
let repository: string;
let skillsHome: string;

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
const EXAMPLE_ID = "EX-01m0c000000000000000000004";

function writeQuality(): void {
  writeFileSync(join(repository, ".kotta/spec/quality-attributes/brief-latency-qa000001.md"), [
    "---", `id: ${QUALITY_ID}`, "form: quality-attribute", "title: Validation stays under a second", "---", "",
    "## Source", "An author.", "",
    "## Stimulus", "They ask for the validation report.", "",
    "## Environment", "A workspace holding a hundred specification nodes.", "",
    "## Artifact", "The validate command.", "",
    "## Response", "The report is returned with every node measured.", "",
    "## Measure", "Under one second at the 95th percentile.", "",
  ].join("\n"));
}

function writeGoal(extraFrontmatter: string[] = [], measuredBy = `[${QUALITY_ID}]`): void {
  writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), [
    "---", `id: ${GOAL_ID}`, "form: goal", "title: The specification governs the code",
    `measured_by: ${measuredBy}`, ...extraFrontmatter, "---", "",
    "## Outcome", "The code says which promise it keeps.", "",
    "## Context", "Nothing read a specification node before.", "",
    "## Baseline and target", "Baseline zero readers; target every node measured.", "",
  ].join("\n"));
}

function writeExample(subjects = `[${QUALITY_ID}]`): void {
  writeFileSync(join(repository, ".kotta/spec/examples/validation-is-fast-ex000004.md"), [
    "---", `id: ${EXAMPLE_ID}`, "form: example", "title: Validation is fast", `subjects: ${subjects}`, "---", "",
    "## Given", "A workspace with specification nodes.", "",
    "## When", "The author asks for the report.", "",
    "## Then", "The report arrives under the accepted latency threshold.", "",
  ].join("\n"));
}

function workspaceSnapshot(directory = join(repository, ".kotta"), relative = ""): Array<[string, string]> {
  return readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    const path = join(directory, entry.name);
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    return entry.isDirectory() ? workspaceSnapshot(path, name) : [[name, readFileSync(path, "utf8")]];
  });
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "kotta-spec-reference-"));
  skillsHome = mkdtempSync(join(tmpdir(), "kotta-spec-reference-skills-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: repository });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: repository });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repository });
  const init = invoke(["init"]);
  if (init.status !== 0) throw new Error(init.stderr);
  writeQuality();
  writeGoal();
  writeExample();
});

describe("the specification is measured against its own form", () => {
  test("a complete workspace validates and counts its nodes and forms", () => {
    const validated = report(["validate"]);
    expect(validated.ok).toBe(true);
    expect(validated.data.specNodes).toBe(3);
    expect(validated.data.forms).toBe(11);
  });

  test("repeated validation is deterministic and writes no workspace bytes", () => {
    const before = workspaceSnapshot();
    const first = report(["validate"]);
    const between = workspaceSnapshot();
    const second = report(["validate"]);

    expect(first).toEqual(second);
    expect(between).toEqual(before);
    expect(workspaceSnapshot()).toEqual(before);
  });

  test("a missing required frontmatter field is named with its file and form", () => {
    writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"),
      readFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), "utf8").replace("title: The specification governs the code", ""));

    const validated = report(["validate"]);
    expect(validated.ok).toBe(false);
    const issue = validated.errors?.find((error) => error.code === "SPEC_NODE_MISSING_FIELD");
    expect(issue?.message).toContain("'title'");
    expect(issue?.message).toContain("goal");
  });

  test("a missing required body heading is named", () => {
    writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"),
      readFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), "utf8").replace("## Baseline and target", "## Notes"));

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_MISSING_SECTION");
    expect(issue?.message).toContain("Baseline and target");
  });

  test("an edge answered fewer times than its minimum is named", () => {
    writeGoal([], "[]");

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_MISSING_EDGE");
    expect(issue?.message).toContain("measurement");
    expect(issue?.message).toContain("measured_by");
    expect(issue?.message).toContain("How will we know this goal was reached?");
  });

  test("an incoming edge below its minimum names the registered question", () => {
    writeExample("[]");

    const issues = report(["validate"]).errors ?? [];
    const issue = issues.find((error) => error.code === "SPEC_NODE_MISSING_EDGE" && error.message.includes("verification"));
    expect(issue?.message).toContain("brief-latency-qa000001.md");
    expect(issue?.message).toContain("Who measures this quality, and where?");
  });

  test("an edge pointing at nothing, and one pointing at the wrong form, are told apart", () => {
    const missing = "QA-01m0czzzzzzzzzzzzzzzzzzzzz";
    writeGoal([], `[${missing}]`);
    const dangling = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_DANGLING_EDGE");
    expect(dangling?.message).toContain("spec-governs-g0000002.md");
    expect(dangling?.message).toContain("measurement");
    expect(dangling?.message).toContain("measured_by");
    expect(dangling?.message).toContain(missing);
    expect(dangling?.message).toContain("Add that node or correct/remove");

    writeGoal([], `[${GOAL_ID}]`);
    const wrong = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_WRONG_TARGET");
    expect(wrong?.message).toContain("is a goal");
  });

  test("a project-added form participates without a code change", () => {
    writeFileSync(join(repository, ".kotta/spec/forms/risk.yaml"), [
      "id: risk", "version: 1", "directory: risks", "canonical_source: Project",
      "description: A named risk with an owner.",
      "identity:", "  prefix: RK", '  format: "<prefix>-<26-character lowercase Crockford ULID>"', '  filename: "<slug>-<last 8 id characters>.md"',
      "required_fields:", "  frontmatter: [id, form, title, owner]", "  body_headings: [Risk, Mitigation]",
      "required_edges: []",
      "recognition_signals:", "  - Something might go wrong.", "",
    ].join("\n"));
    expect(invoke(["sync"]).status).toBe(0);
    writeFileSync(join(repository, ".kotta/spec/risks/registry-drift-rk000001.md"), [
      "---", "id: RK-01m0c000000000000000000003", "form: risk", "title: The registry drifts", "---", "",
      "## Risk", "The forms and the nodes disagree.", "",
    ].join("\n"));

    const errors = report(["validate"]).errors ?? [];
    expect(errors.map((error) => error.message).join("\n")).toContain("'owner'");
    expect(errors.map((error) => error.message).join("\n")).toContain("Mitigation");
  });

  test("a node id must match the prefix and shape declared by its form", () => {
    writeFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"),
      readFileSync(join(repository, ".kotta/spec/goals/spec-governs-g0000002.md"), "utf8").replace(GOAL_ID, "G-short"));

    const issue = report(["validate"]).errors?.find((error) => error.code === "SPEC_NODE_INVALID_ID");
    expect(issue?.message).toContain("G-short");
    expect(issue?.message).toContain("G- followed by a 26-character lowercase Crockford id");
  });
});
