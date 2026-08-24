import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const SPEC_ID = "GT-01m0c0000000000000000000cv";
const CONDITION = "The task executes the accepted promise.";

function invoke(root: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd: root, encoding: "utf8" });
}

function run(root: string, args: string[]): { ok: boolean; command: string; data: Record<string, unknown> } {
  const result = invoke(root, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function fixture(retiredOptIn = false): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-coverage-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  writeFileSync(join(root, ".kotta/spec/glossary-terms/accepted-promise-000000cv.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Accepted promise", "---", "",
    "## Definition", "The task executes the accepted promise.", "",
    "## Usage", "A covered task names this node.", "",
    "## Non-examples", "An unreferenced acceptance condition.", "",
  ].join("\n"));
  if (retiredOptIn) {
    // A workspace written before the gate retired still carries the key; nothing reads it now.
    const config = join(root, ".kotta/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace("workflow:\n", "workflow:\n  require_human_sign_approval: true\n"));
  }
  git(root, "add", ".");
  git(root, "commit", "-m", "accept specification");
  return root;
}

function definition(root: string, id: string, covered = true): string {
  const path = join(tmpdir(), `${id}-${covered ? "covered" : "uncovered"}.md`);
  writeFileSync(path, [
    "---", `id: ${id}`, "spec:", `  - ${SPEC_ID}`,
    ...(covered ? ["coverage:", `  \"${CONDITION}\":`, `    - ${SPEC_ID}`] : []),
    "---", "", "## Outcome", "The accepted promise is executable.", "", "## Scope", "One covered task.", "",
    "## Non-goals", "No unrelated behavior.", "", "## Acceptance", `- ${CONDITION}`, "",
    "## Verification", "- Run the coverage integration test.", "", "## Constraints", "None.", "",
    "## Open decisions", "None.", "", "## Execution notes", "None.", "",
  ].join("\n"));
  return path;
}

function create(root: string): string {
  return String(run(root, ["task", "new", "--title", "Execute accepted promise", "--type", "feature"]).data.id);
}

describe("accepted-spec coverage defines executable tasks", () => {
  test("covered define reaches defined without sign, starts, and puts the map in the brief", () => {
    const root = fixture();
    const id = create(root);
    const result = run(root, ["task", "define", id, "--from", definition(root, id)]);

    expect(result.data).toMatchObject({ id, state: "defined" });
    const brief = run(root, ["task", "brief", id]).data as { coverage: Array<{ acceptance: string; spec: string[] }>; brief: string };
    expect(brief.coverage).toEqual([{ acceptance: CONDITION, spec: [SPEC_ID] }]);
    expect(brief.brief).toContain(`- ${CONDITION} → ${SPEC_ID}`);
    expect(run(root, ["task", "start", id, "--agent", "codex"]).data).toMatchObject({ id });
  });

  test("define refuses and names an uncovered acceptance condition without changing backlog state", () => {
    const root = fixture();
    const id = create(root);
    const result = invoke(root, ["task", "define", id, "--from", definition(root, id, false)]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("ACCEPTANCE_NOT_COVERED");
    expect(result.stdout).toContain(CONDITION);
    expect(result.stdout).toContain("record an observation and amend the spec");
    expect(run(root, ["task", "show", id]).data.state).toBe("backlog");
  });

  test("a workspace still carrying the retired sign opt-in is not held back by it", () => {
    const root = fixture(true);
    const id = create(root);
    const defined = run(root, ["task", "define", id, "--from", definition(root, id)]);

    // The key is inert: a covered definition reaches defined, and nothing asks for a sign-off.
    expect(defined.data).toMatchObject({ id, state: "defined" });
    expect(String(defined.data.nextStep)).toBe(`kotta task start ${id} --agent <agent>`);
    expect(run(root, ["task", "validate", id])).toMatchObject({ ok: true, data: { state: "defined" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(invoke(root, ["task", "sign", id, "--approve"]).stderr).toContain("unknown command 'sign'");
  });
});
