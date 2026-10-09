import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { json, node, setNarrative, write } from "./planning-fixture.js";
import type { StructureNode } from "../../src/spec/structure.js";
import { IDS, flat, told } from "../fixtures/intimity-structure/index.js";

/**
 * The structure through the CLI: a goal serves a goal and never itself (BR-01m4gg8vnq75d4rkw1e0x1b734),
 * validate names a flat structure without refusing it (BR-01m4ggqbgh250jcn09w3t5sxqq), and the import
 * asks what its goals serve instead of drafting a purpose (BR-01m4ggqbpgfp2w72q9p9yt2era).
 */

const SPEC = ".kotta/spec";
const PROOF = "EX-01m4gh000000000000000000e1";
const git = (root: string, ...args: string[]) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
const slug = (title: string) => title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

function workspace(label: string, nodes: StructureNode[]): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-structure-${label}-`));
  git(root, "init", "-q", "-b", "main");
  execFileSync("node", [resolve("dist/cli/index.js"), "init", "--json"], { cwd: root });
  setNarrative(root, null);
  for (const item of nodes) {
    const file = (directory: string) => `${SPEC}/${directory}/${slug(item.title)}-${item.id.slice(-8)}.md`;
    if (item.form === "actor") write(root, file("actors"), node({ id: item.id, form: "actor", title: item.title }, { Role: "Plays.", Goals: "An evening.", Responsibilities: "Answers." }));
    if (item.form === "goal") write(root, file("goals"), node({ id: item.id, form: "goal", title: item.title, measured_by: [PROOF], ...(item.edges.serves?.length ? { serves: item.edges.serves } : {}) }, { Outcome: "It holds.", Context: "Intimity.", "Baseline and target": "More." }));
    if (item.form === "use-case") {
      const edges = Object.fromEntries(Object.entries(item.edges).filter(([, ids]) => ids.length));
      write(root, file("use-cases"), node({ id: item.id, form: "use-case", title: item.title, level: item.level, ...edges }, { Intent: "Stated.", Preconditions: "None.", "Main success scenario": "1. It happens.", Alternatives: "None." }));
    }
  }
  write(root, `${SPEC}/examples/the-evening-works-${PROOF.slice(-8)}.md`, node({ id: PROOF, form: "example", title: "The evening works", subjects: nodes.filter((item) => item.form === "use-case").map((item) => item.id) }, { Given: "A couple.", When: "They play.", Then: "It works." }));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "intimity");
  return root;
}

type Issue = { code: string; message: string; path?: string };
const report = (root: string) => json(root, ["validate"]).body as unknown as { ok: boolean; errors: Issue[]; warnings: Issue[] };

describe("the structure of a specification through the CLI", () => {
  test("eight goals serve one purpose; a goal that serves itself through another is refused (EX-01m4gg8wkj7dzaje345c4ska46)", () => {
    const root = workspace("serves", told());
    const served = report(root);
    expect(served.ok).toBe(true);
    expect(served.errors.map((issue) => issue.code)).not.toContain("SPEC_NODE_CYCLE");

    const cyclic = told().map((item) => item.id === IDS.purpose ? { ...item, edges: { serves: [IDS.honest] } } : item);
    const looped = report(workspace("serves-cycle", cyclic));
    const cycle = looped.errors.find((issue) => issue.code === "SPEC_NODE_CYCLE");
    expect(looped.ok).toBe(false);
    expect(cycle?.message).toContain("Find an evening both welcome");
    expect(cycle?.message).toContain("Each partner can answer honestly, in private");
    expect(cycle?.message).toContain("A goal may not serve itself");
  });

  test("validate warns about a flat import and passes (EX-01m4ggqd1y597jjpamfw69d6j8)", () => {
    const result = report(workspace("flat", flat()));
    expect(result.ok).toBe(true);
    const codes = result.warnings.map((issue) => issue.code);
    expect(codes).toContain("SPEC_GOALS_WITHOUT_PURPOSE");
    expect(codes).toContain("SPEC_NO_JOURNEY");
    const purpose = result.warnings.find((issue) => issue.code === "SPEC_GOALS_WITHOUT_PURPOSE")!;
    expect(purpose.message).toMatch(/^8 goals serve no other goal/);
    expect(purpose.message).toContain("in a change");
    expect(result.warnings.find((issue) => issue.code === "SPEC_NO_JOURNEY")!.message).toContain("Player — 9 use cases and no journey");

    const quiet = report(workspace("told", told()));
    expect(quiet.warnings.map((issue) => issue.code).filter((code) => code.startsWith("SPEC_GOALS") || code.startsWith("SPEC_NO_JOURNEY") || code === "SPEC_OFF_JOURNEY")).toEqual([]);
  });

  test("the import asks which purpose its goals serve and which journey the use cases form, drafting neither (EX-01m4ggqd7z6b055594jy17zjzw)", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-structure-import-"));
    git(root, "init", "-q", "-b", "main");
    execFileSync("node", [resolve("dist/cli/index.js"), "init", "--json"], { cwd: root });
    for (const capability of ["pairing", "rounds"]) {
      write(root, `openspec/specs/${capability}/spec.md`, [`# ${capability} Specification`, "", "## Purpose", `The ${capability} work for a couple.`, "", "## Requirements", "", `### Requirement: ${capability} hold`, `The system SHALL keep ${capability}.`, "", "#### Scenario: It holds", "- **WHEN** it is used", "- **THEN** it holds", ""].join("\n"));
    }
    const imported = json(root, ["import", "openspec", "--change", "baseline"]);
    expect(imported.status).toBe(0);
    expect(imported.body.data.drafted.goals).toBe(2);
    const proposal = readFileSync(join(root, ".kotta/changes/baseline/proposal.md"), "utf8");
    expect(proposal).toContain("## Open decisions");
    expect(proposal).toContain("Which purpose do the 2 goals serve?");
    expect(proposal).toContain("Which journey do the use cases form?");
    expect(imported.body.data.notDerived).toContain("use-case");
  });
});
