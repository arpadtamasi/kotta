import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const ACTOR = "A-01m0c0000000000000000000a1";
const GOAL = "G-01m0c0000000000000000000g1";
const USE_CASE = "UC-01m0c0000000000000000000c1";

/** A version-6 workspace with three linked nodes, read from the working tree (no base ref). */
function workspaceFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-ui-data-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  writeFileSync(join(root, ".kotta/spec/actors/operator-00000a1.md"), ["---", `id: ${ACTOR}`, "form: actor", "title: Operator", "---", "", "## Role", "Runs it.", "", "## Goals", "Ship.", "", "## Responsibilities", "Decide.", ""].join("\n"));
  writeFileSync(join(root, ".kotta/spec/goals/accounted-00000g1.md"), ["---", `id: ${GOAL}`, "form: goal", "title: Work is accounted for", "accepted:", '  - "unexamined: nobody has looked yet"', "---", "", "## Outcome", "Accounted.", "", "## Context", "Now.", "", "## Baseline and target", "0 → 1.", ""].join("\n"));
  writeFileSync(join(root, ".kotta/spec/use-cases/export-00000c1.md"), ["---", `id: ${USE_CASE}`, "form: use-case", "title: Export a report", `actor: [${ACTOR}]`, `goal: [${GOAL}]`, "---", "", "## Intent", `Export, for ${ACTOR}.`, "", "## Preconditions", "None.", "", "## Main success scenario", "It exports.", "", "## Alternatives", "None.", ""].join("\n"));
  return root;
}

describe("the board reads the specification", () => {
  test("every node of every registered form, with its admission and the edges it answers", () => {
    const workspace = readWorkspace(workspaceFixture());

    expect(workspace.specForms.map((form) => form.id)).toHaveLength(11);
    expect(workspace.spec.map((node) => node.id).sort()).toEqual([ACTOR, GOAL, USE_CASE].sort());
    const useCase = workspace.spec.find((node) => node.id === USE_CASE)!;
    expect(useCase).toMatchObject({ form: "use-case", title: "Export a report", path: ".kotta/spec/use-cases/export-00000c1.md" });
    expect(useCase.edges).toEqual({ actor: [ACTOR], goal: [GOAL] });
    expect(useCase.sections.intent).toBe(`Export, for ${ACTOR}.`);
    expect(workspace.spec.find((node) => node.id === GOAL)?.accepted).toEqual(["unexamined: nobody has looked yet"]);
    expect(workspace.notices).toEqual([]);
  });

  test("carries no process: no tasks, batches, observations, decisions, events or claims", () => {
    const workspace = readWorkspace(workspaceFixture()) as unknown as Record<string, unknown>;
    for (const key of ["tasks", "batches", "observations", "decisions", "events", "claims", "migration", "diagnostics"]) {
      expect(workspace, `the payload has no ${key}`).not.toHaveProperty(key);
    }
  });

  test("a pre-1.0 workspace is refused, not explained", () => {
    const root = workspaceFixture();
    mkdirSync(join(root, ".kotta/process/tasks"), { recursive: true });
    expect(() => readWorkspace(root)).toThrow(/pre-1\.0 Kotta workspace shape[\s\S]*kotta migrate/);
  });
});
