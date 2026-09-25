import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { openQuestions } from "../../src/commands/questions.js";

/**
 * An open question names the answer it waits for. A draft carries its undecided points under an
 * `Open decisions` heading, one list item each, addressed by position; `kotta questions` lists them
 * for one node or for the whole specification, and the same parse serves the CLI and the MCP tool.
 */

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: { entity: string | null; entities: Array<{ id: string; title: string; open: number; questions: Array<{ position: number; reference: string; text: string; resolved: boolean }> }>; total: number; open: number } };
};

const OPEN = "BR-01m0c0000000000000000000q1";
const SETTLED = "BR-01m0c0000000000000000000q2";
const QUIET = "BR-01m0c0000000000000000000q3";

function rule(id: string, title: string, openDecisions: string | null): string {
  return [
    "---", `id: ${id}`, "form: business-rule", `title: ${title}`, "---", "",
    "## Rule", "", "Something holds.", "", "## Rationale", "", "Because.", "", "## Scope", "", "Here.", "",
    ...(openDecisions === null ? [] : ["## Open decisions", "", openDecisions, ""]),
  ].join("\n");
}

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-questions-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  const rules = join(root, ".kotta/spec/business-rules");
  writeFileSync(join(rules, "open-00000q1.md"), rule(OPEN, "A rule with two open points", "- Which currency is the default?\n- Does the export include archived rows?\n  Not decided yet."));
  writeFileSync(join(rules, "settled-00000q2.md"), rule(SETTLED, "A rule with one answered point", "- Which timezone? Settled by D-01m0c0000000000000000000d1."));
  writeFileSync(join(rules, "quiet-00000q3.md"), rule(QUIET, "A rule with nothing open", "None."));
  return root;
}

describe("a draft's open questions", () => {
  test("are listed by position, with continuation lines folded into the item above", () => {
    const root = workspace();
    const result = run(root, ["questions", OPEN]);
    expect(result.data.entity).toBe(OPEN);
    expect(result.data.entities).toHaveLength(1);
    const [node] = result.data.entities;
    expect(node.open).toBe(2);
    expect(node.questions.map((question) => question.reference)).toEqual([`${OPEN}/Q1`, `${OPEN}/Q2`]);
    expect(node.questions[1].text).toBe("Does the export include archived rows? Not decided yet.");
  });

  test("the workspace-wide listing puts the most open first and leaves the empty enumeration out", () => {
    const root = workspace();
    const result = run(root, ["questions"]);
    expect(result.data.entity).toBeNull();
    expect(result.data.entities.map((node) => node.id)).toEqual([OPEN, SETTLED]);
    expect(result.data.total).toBe(3);
    expect(result.data.open).toBe(2);
    // A question naming a decision reference reads as answered at face value.
    expect(result.data.entities[1].questions[0].resolved).toBe(true);
  });

  test("a short id resolves, an unknown one is refused, and a node asking nothing says so", () => {
    const root = workspace();
    expect(run(root, ["questions", `BR-${OPEN.slice(-8)}`]).data.entity).toBe(OPEN);
    const quiet = spawnSync("node", [cli, "questions", QUIET], { cwd: root, encoding: "utf8" });
    expect(quiet.status).toBe(0);
    expect(quiet.stdout).toContain("asks no open question");
    const unknown = spawnSync("node", [cli, "questions", "BR-nope"], { cwd: root, encoding: "utf8" });
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toContain("No specification node matches");
  });

  test("both surfaces read one parse: the CLI prints what the service returns", () => {
    const root = workspace();
    const service = openQuestions(undefined, root).data;
    const printed = spawnSync("node", [cli, "questions"], { cwd: root, encoding: "utf8" }).stdout;
    for (const node of service.entities) {
      expect(printed).toContain(node.title);
      for (const question of node.questions) expect(printed).toContain(`Q${question.position}`);
    }
    expect(printed).toContain(`${service.open} open of ${service.total} across 2 nodes.`);
  });
});
