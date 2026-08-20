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

function fixture(optInSign = false): string {
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
  if (optInSign) {
    const config = join(root, ".kotta/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace("require_human_sign_approval: false", "require_human_sign_approval: true"));
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
  return String(run(root, ["contract", "new", "--title", "Execute accepted promise", "--type", "feature"]).data.id);
}

describe("accepted-spec coverage defines executable tasks", () => {
  test("covered define reaches defined without sign, starts, and puts the map in the brief", () => {
    const root = fixture();
    const id = create(root);
    const result = run(root, ["contract", "define", id, "--from", definition(root, id)]);

    expect(result.data).toMatchObject({ id, state: "defined" });
    const brief = run(root, ["contract", "brief", id]).data as { coverage: Array<{ acceptance: string; spec: string[] }>; brief: string };
    expect(brief.coverage).toEqual([{ acceptance: CONDITION, spec: [SPEC_ID] }]);
    expect(brief.brief).toContain(`- ${CONDITION} → ${SPEC_ID}`);
    expect(run(root, ["contract", "start", id, "--agent", "codex"]).data).toMatchObject({ id });
  });

  test("define refuses and names an uncovered acceptance condition without changing backlog state", () => {
    const root = fixture();
    const id = create(root);
    const result = invoke(root, ["contract", "define", id, "--from", definition(root, id, false)]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("ACCEPTANCE_NOT_COVERED");
    expect(result.stdout).toContain(CONDITION);
    expect(result.stdout).toContain("record an observation and amend the spec");
    expect(run(root, ["contract", "show", id]).data.state).toBe("backlog");
  });

  test("an opt-in workspace keeps the sign gate and the approval leaves a receipt", () => {
    const root = fixture(true);
    const id = create(root);
    const defined = run(root, ["contract", "define", id, "--from", definition(root, id)]);
    expect(defined.data.state).toBe("backlog");

    const refused = invoke(root, ["contract", "sign", id]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human sign-off is required");
    run(root, ["contract", "sign", id, "--approve"]);
    const shown = run(root, ["contract", "show", id]).data as { state: string; frontmatter: Record<string, unknown> };
    expect(shown.state).toBe("defined");
    expect(JSON.stringify(shown)).toContain("contract.sign");
  });
});
