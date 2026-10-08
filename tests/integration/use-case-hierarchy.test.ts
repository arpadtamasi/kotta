import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { json, node, run, setNarrative, write } from "./planning-fixture.js";

/**
 * The use-case hierarchy through the CLI: decomposition and its cycle (BR-01m4ee22ypyq06n7vkk4ycnz9v),
 * refinement read from the requirement's side (BR-01m4ee234nxva765r3jq5vmw01), overall requirements
 * (BR-01m4ee23baq19gd87ez4m9zxdw), what a drop takes with it (BR-01m4ee23h66jzr4wzd0a3grf02), the
 * place every requirement needs (BR-01m4ee23pwf0sg22vta05bc2hz) and a form that changes only through a
 * change (BR-01m4ee245pe1wb8x8n7wxyvxwh).
 */

const id = (prefix: string, tail: string) => `${prefix}-01m4ee${"0".repeat(20 - tail.length)}${tail}`;
const STUDENT = id("A", "a1");
const TEACHER = id("A", "a2");
const LEARN = id("G", "g1");
const ASKS = id("UC", "c1");
const TEST_CHAT = id("UC", "c2");
const UPLOAD = id("UC", "c3");
const PROCESS = id("UC", "c4");
const SEARCHABLE = id("UC", "c5");
const IMAGE_MODE = id("UC", "c6");
const CITATION = id("BR", "b1");
const OWN_CHAT = id("BR", "b2");
const READS_ONLY = id("BR", "b3");
const SLUG = id("BR", "b4");
const PROOF = id("EX", "e1");
const SPEC = ".kotta/spec";

const git = (root: string, ...args: string[]) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
const commit = (root: string, message: string) => { git(root, "add", "-A"); git(root, "commit", "-q", "-m", message); };

const steps = { Intent: "Stated.", Preconditions: "None.", "Main success scenario": "1. It happens.", Alternatives: "None." };
function useCase(root: string, key: string, title: string, extra: Record<string, unknown>, under = SPEC): void {
  write(root, `${under}/use-cases/${title.toLowerCase().replace(/[^a-z]+/g, "-")}-${key.slice(-8)}.md`, node({ id: key, form: "use-case", title, actor: [TEACHER], goal: [LEARN], ...extra }, steps));
}
function rule(root: string, key: string, title: string, extra: Record<string, unknown> = {}, under = SPEC): void {
  write(root, `${under}/business-rules/${title.toLowerCase().replace(/[^a-z]+/g, "-")}-${key.slice(-8)}.md`, node({ id: key, form: "business-rule", title, ...extra }, { Rule: `${title}.`, Rationale: "Stated.", Scope: "Everywhere." }));
}

function example(root: string, key: string, title: string, subjects: string[], under = SPEC, extra: Record<string, unknown> = {}): void {
  write(root, `${under}/examples/${title.toLowerCase().replace(/[^a-z]+/g, "-")}-${key.slice(-8)}.md`, node({ id: key, form: "example", title, subjects, ...extra }, { Given: "A course.", When: "It is used.", Then: "It works." }));
}

/** The oktat-ai shape, accepted: two actors, the upload decomposed, a rule refined twice, one overall, one with no place. */
function workspace(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-hierarchy-${label}-`));
  git(root, "init", "-q", "-b", "main");
  execFileSync("node", [resolve("dist/cli/index.js"), "init", "--json"], { cwd: root });
  setNarrative(root, null);
  write(root, `${SPEC}/actors/student-${STUDENT.slice(-8)}.md`, node({ id: STUDENT, form: "actor", title: "Student" }, { Role: "Learns.", Goals: "To learn.", Responsibilities: "Asks." }));
  write(root, `${SPEC}/actors/teacher-${TEACHER.slice(-8)}.md`, node({ id: TEACHER, form: "actor", title: "Teacher" }, { Role: "Teaches.", Goals: "To teach.", Responsibilities: "Uploads." }));
  write(root, `${SPEC}/goals/learning-${LEARN.slice(-8)}.md`, node({ id: LEARN, form: "goal", title: "Students learn from the course", measured_by: [PROOF] }, { Outcome: "Learning.", Context: "A course.", "Baseline and target": "More." }));
  useCase(root, ASKS, "A student asks and gets a cited answer", { level: "user-goal", actor: [STUDENT], refines: [CITATION] });
  useCase(root, TEST_CHAT, "The teacher tries the course chat", { level: "user-goal", refines: [OWN_CHAT, CITATION] });
  useCase(root, UPLOAD, "A teacher uploads a material and it becomes searchable", { level: "user-goal", includes: [PROCESS, SEARCHABLE] });
  useCase(root, PROCESS, "The system processes the material", { level: "subfunction" });
  useCase(root, SEARCHABLE, "The material becomes searchable", { level: "subfunction" });
  useCase(root, IMAGE_MODE, "Choosing the image mode", { extends: [UPLOAD] });
  rule(root, CITATION, "Citation to the place");
  rule(root, OWN_CHAT, "Own test chat");
  rule(root, READS_ONLY, "The browser only reads", { overall: true });
  rule(root, SLUG, "Slug format");
  example(root, PROOF, "The course works", [ASKS, TEST_CHAT, UPLOAD, PROCESS, SEARCHABLE, IMAGE_MODE, CITATION, OWN_CHAT, READS_ONLY, SLUG]);
  commit(root, "the accepted specification");
  return root;
}

type Issue = { code: string; message: string; path?: string };
const report = (root: string) => json(root, ["validate"]).body as unknown as { ok: boolean; errors: Issue[]; warnings: Issue[] };

describe("the use-case hierarchy", () => {
  test("validate accepts includes and extends, names a cycle, and checks the level (EX-01m4ee24hbczjt2k76pn2cq2wm)", () => {
    const root = workspace("decompose");
    const clean = report(root);
    expect([...clean.errors, ...clean.warnings].map((issue) => issue.code)).not.toContain("SPEC_NODE_CYCLE");

    useCase(root, SEARCHABLE, "The material becomes searchable", { level: "subfunction", includes: [UPLOAD] });
    useCase(root, PROCESS, "The system processes the material", { level: "a detail" });
    const cyclic = report(root);
    const cycle = cyclic.errors.filter((issue) => issue.code === "SPEC_NODE_CYCLE");
    expect(cycle).toHaveLength(1);
    expect(cycle[0].message).toContain("A teacher uploads a material and it becomes searchable → The material becomes searchable");
    expect(cyclic.errors.find((issue) => issue.code === "SPEC_NODE_INVALID_VALUE")?.message).toContain('"subfunction"');
  });

  test("a rule nothing places is named on the accepted model, with both ways to place it (EX-01m4ee258z2d2chy2atcq4ken0, EX-01m4ee24wn2str3e4x5bw102cn)", () => {
    const root = workspace("place");
    const result = report(root);
    const unplaced = result.warnings.filter((issue) => issue.code === "SPEC_NODE_NO_PLACE");
    // Only the slug rule: the overall rule needs no use case, the twice-refined rule has two.
    expect(unplaced.map((issue) => issue.message.split(" (")[0])).toEqual(["Slug format"]);
    expect(unplaced[0].message).toContain("under 'refines'");
    expect(unplaced[0].message).toContain("'overall: true'");
    expect(result.errors.map((issue) => issue.code)).not.toContain("SPEC_NODE_NO_PLACE");
  });

  test("spec impact: what falls out with a dropped use case and what stays (EX-01m4ee25302x5t30r2h67hcxk8, EX-01m4ee24q2jttknm7v1bxrtfn0)", () => {
    const root = workspace("impact");
    const dropped = json(root, ["spec", "impact", "The teacher tries the course chat"]);
    expect(dropped.status).toBe(0);
    expect(dropped.body.data.out.map((entry: { title: string }) => entry.title)).toEqual(["Own test chat"]);
    expect(dropped.body.data.stays.map((entry: { title: string }) => entry.title)).toEqual(["Citation to the place"]);
    const text = run(root, ["spec", "impact", TEST_CHAT]).stdout;
    expect(text).toContain("If The teacher tries the course chat is dropped:");
    expect(text).toContain("1 requirement falls out");

    // The upload takes what it includes and what extends it.
    const upload = json(root, ["spec", "impact", UPLOAD.slice(-8)]);
    expect(upload.body.data.branch.map((entry: { id: string }) => entry.id).sort()).toEqual([PROCESS, SEARCHABLE, IMAGE_MODE].sort());

    // An overall requirement never falls out, whichever use case goes.
    for (const key of [ASKS, TEST_CHAT, UPLOAD, PROCESS, SEARCHABLE, IMAGE_MODE]) {
      expect(json(root, ["spec", "impact", key]).body.data.out.map((entry: { id: string }) => entry.id)).not.toContain(READS_ONLY);
    }
    expect(run(root, ["spec", "impact", "No such use case"]).status).not.toBe(0);
  });

  test("a new edge lands with the change that uses it, and a form edited outside a change is named (EX-01m4ee25mtyaj0zeh1r5szmz29)", () => {
    const root = workspace("forms");
    // The project's registry predates the refinement edge: no use case may name a rule under `refines` yet.
    const formPath = join(root, SPEC, "forms/use-case.yaml");
    const shipped = readFileSync(formPath, "utf8");
    const older = shipped.replace(/  # The requirements this use case relies on[\s\S]*?question: Which rules, interfaces and quality attributes does this use case rely on\?\n/, "");
    expect(older).not.toBe(shipped);
    writeFileSync(formPath, older);
    commit(root, "the older registry");

    // Editing the form by hand is named: it belongs in a change.
    writeFileSync(formPath, `${older}# hand edit\n`);
    expect(report(root).warnings.map((issue) => issue.code)).toContain("SPEC_FORM_EDITED_OUTSIDE_CHANGE");
    writeFileSync(formPath, older);

    const change = ".kotta/changes/refine-edge";
    const NEW_RULE = id("BR", "b9");
    const stated = { level: "stated", decided_by: "human", sources: [`${change}/proposal.md · Why`], quote: "the rule belongs to the use case — operator, 2026-10-08" };
    const unbuilt = ["unimplemented: the fixture has no code"];
    write(root, `${change}/proposal.md`, "# The refinement edge\n\n## Why\n\nA rule belongs to a use case.\n");
    write(root, `${change}/model/forms/use-case.yaml`, shipped);
    useCase(root, ASKS, "A student asks and gets a cited answer", { level: "user-goal", actor: [STUDENT], refines: [CITATION, NEW_RULE], accepted: unbuilt, provenance: stated }, `${change}/model`);
    rule(root, NEW_RULE, "An answer names its page", { accepted: unbuilt, provenance: stated }, `${change}/model`);
    example(root, id("EX", "e9"), "The answer names page three", [NEW_RULE], `${change}/model`, { accepted: unbuilt, provenance: stated });
    const planned = run(root, ["plan", "refine-edge"]);
    expect(planned.status, planned.stdout + planned.stderr).toBe(0);
    expect(run(root, ["approve", "refine-edge", "--by", "Ada"]).status).toBe(0);
    const archived = run(root, ["archive", "refine-edge"]);
    expect(archived.status, archived.stdout + archived.stderr).toBe(0);
    expect(readFileSync(formPath, "utf8")).toBe(shipped);
    expect(existsSync(join(root, ".kotta/changes/archive"))).toBe(true);
    commit(root, "archived");
    expect(report(root).warnings.map((issue) => issue.code)).not.toContain("SPEC_FORM_EDITED_OUTSIDE_CHANGE");
  });

  test("a rule a change adds with no place is refused in the change", () => {
    const root = workspace("change-place");
    const change = ".kotta/changes/orphan";
    const ORPHAN = id("BR", "b8");
    write(root, `${change}/proposal.md`, "# Orphan\n\n## Why\n\nA rule.\n");
    rule(root, ORPHAN, "A rule with no use case", { accepted: ["unimplemented: none"], provenance: { level: "stated", decided_by: "human", sources: [`${change}/proposal.md · Why`], quote: "q — operator" } }, `${change}/model`);
    const planned = json(root, ["plan", "orphan"]);
    expect(JSON.stringify(planned.body)).toContain("has no place in the hierarchy");
  });
});

