import { existsSync, readFileSync, readdirSync, utimesSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";
import { boundRequirements, normalizeProse } from "../../src/spec/narrative.js";
import {
  GAME, HOLD, LIFECYCLE, PAUSE, PROMPT, QUIT, QUIT_RULE_AFTER, TERM,
  answerPause, json, node, planningWorkspace, run, write,
} from "./planning-fixture.js";

/**
 * The planning phase: a change's model delta is measured against the accepted model (`kotta plan`),
 * the one human gate is recorded on it (`kotta approve`), and the approved delta lands without
 * another question (`kotta archive`). "The planning never invents intent" and "the model is the
 * accepted truth; a disagreement is reported, never smoothed over" are what these tests hold.
 */

const CHANGE = "openspec/changes/add-pause";
const today = () => new Date().toISOString().slice(0, 10);

/** Push a file's mtime into the future, so "changed after the report" does not hang on clock resolution. */
function touchLater(path: string): void {
  const later = new Date(Date.now() + 60_000);
  utimesSync(path, later, later);
}

describe("provenance in validation", () => {
  test("is optional on an accepted node, required on a change's node, and measured in full wherever present", () => {
    const root = planningWorkspace("validate");
    expect(json(root, ["validate"]).body.ok).toBe(true);
    // The text names the open change's model nodes too, not only the accepted ones.
    expect(run(root, ["validate"]).stdout.split("\n")[0]).toBe("The specification validates: 6 nodes across 11 forms; 1 open change with 4 model nodes.");

    write(root, `${CHANGE}/model/goals/unmarked-000000g9.md`, node(
      { id: "G-01m0p0000000000000000000g9", form: "goal", title: "Unmarked", measured_by: [PROMPT] },
      { Outcome: "o", Context: "c", "Baseline and target": "b" }));
    const refused = json(root, ["validate"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors).toEqual([expect.objectContaining({ code: "SPEC_NODE_PROVENANCE", message: expect.stringContaining("has no provenance") })]);
  });

  test("a half-filled block on an accepted node is refused", () => {
    const root = planningWorkspace("half");
    write(root, `.kotta/spec/entities/game-${GAME.slice(-8)}.md`, node(
      { id: GAME, form: "entity", title: "Game", used_by: [QUIT], provenance: { level: "inferred", decided_by: "agent-decided" } },
      { Meaning: "m", Identity: "i", Attributes: "a", Invariants: "v" }));
    const refused = json(root, ["validate"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors?.map((error) => error.message).join("\n")).toContain("leaves provenance.inferred empty");
  });
});

describe("kotta spec new --into", () => {
  test("drafts the node into the change's model delta, with provenance laid out, and leaves the accepted specification alone", () => {
    const root = planningWorkspace("into");
    const before = readdirSync(join(root, ".kotta/spec/use-cases"));
    const created = json(root, ["spec", "new", "use-case", "--title", "Pause a game", "--into", "add-pause"]);
    expect(created.status).toBe(0);
    expect(created.body.data.change).toBe("add-pause");
    expect(created.body.data.path).toBe(`${CHANGE}/model/use-cases/pause-a-game-${String(created.body.data.id).slice(-8)}.md`);
    expect(created.body.data.unanswered).toContain("provenance");
    const parsed = matter(readFileSync(join(root, created.body.data.path), "utf8"));
    expect(parsed.data.provenance).toEqual({ level: null, decided_by: null, sources: [], quote: null, inferred: null });
    expect(readdirSync(join(root, ".kotta/spec/use-cases"))).toEqual(before);
  });

  test("a change that does not exist is refused, and nothing is written", () => {
    const root = planningWorkspace("into-missing");
    const refused = run(root, ["spec", "new", "goal", "--title", "Anything", "--into", "no-such-change"]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain("No change 'no-such-change' exists");
    expect(existsSync(join(root, "openspec/changes/no-such-change"))).toBe(false);
  });
});

describe("kotta plan", () => {
  test("reports the conflict, the silence and the drift, writes planning.md, and fails while a decision is open", () => {
    const root = planningWorkspace("plan");
    const planned = json(root, ["plan", "add-pause"]);

    expect(planned.status).toBe(1);
    const data = planned.body.data;
    expect(data.structure).toEqual([]);
    expect(data.merged).toEqual([]);
    expect(data.delta.added.map((item: { id: string }) => item.id).sort()).toEqual([PAUSE, HOLD].sort());
    expect(data.delta.modified.map((item: { id: string }) => item.id).sort()).toEqual([QUIT, LIFECYCLE].sort());

    // (c) Candidates, ranked, each awaiting judgement: the lifecycle lost and reversed a transition,
    // the example proving the changed rule is named, and the glossary contrasts the new title.
    const kinds = data.conflicts.map((item: { kind: string; node: { id: string } }) => `${item.kind}:${item.node.id}`);
    expect(kinds.slice(0, 2).sort()).toEqual([`transition-removed:${LIFECYCLE}`, `transition-reversed:${LIFECYCLE}`].sort());
    expect(kinds).toContain(`references-changed:${PROMPT}`);
    expect(kinds).toContain(`glossary-contrast:${TERM}`);
    expect(data.conflicts.every((item: { verdict: string }) => item.verdict === "awaits-judgement")).toBe(true);
    expect(data.conflicts.length).toBeLessThanOrEqual(10);

    // (d) The silence the fixture leaves, named by its position.
    expect(data.silences.openDecisions).toEqual([expect.objectContaining({ reference: `${PAUSE}/Q1`, text: "How long may a pause last?" })]);
    expect(planned.body.errors).toEqual([expect.objectContaining({ code: "OPEN_DECISION" })]);

    // (e) The change's narrative says something the changed rule does not: reported, not repaired.
    expect(data.drift).toEqual([expect.objectContaining({ id: QUIT, kind: "changed", narrative: "The game SHALL quit immediately.", model: QUIT_RULE_AFTER })]);
    expect(readFileSync(join(root, CHANGE, "specs/session/spec.md"), "utf8")).toContain("The game SHALL quit immediately.");

    // (f) Who decided what, and the machine's decisions listed for the gate.
    expect(data.provenance.levels).toEqual({ stated: 3, "partly-inferred": 1, inferred: 0 });
    expect(data.provenance.machineDecisions).toEqual([expect.objectContaining({ id: LIFECYCLE, inferred: "that a finished game can be restarted" })]);

    const report = readFileSync(join(root, CHANGE, "planning.md"), "utf8");
    expect(matter(report).data).toMatchObject({ change: "add-pause", delta_hash: data.deltaHash, ready_for_approval: false });
    for (const heading of ["## (a) Structure of the delta", "## (b) The merged view", "## (c) Conflict candidates", "## (d) Silences", "## (e) Narrative drift", "## (f) Provenance"]) expect(report).toContain(heading);
    expect(report).toContain("the accepted transition running → over now runs over → running");
    expect(report).toContain("How long may a pause last?");
    expect(report).toContain("Game lifecycle (SM-000000s1) — that a finished game can be restarted");
    expect(report).toContain("Awaits judgement.");
  });

  test("lists a machine decision by what it rests on, and keeps the agent's judged findings across a re-plan", () => {
    const root = planningWorkspace("plan-account");
    answerPause(root);
    // Decided by the agent, but stated: nothing was supplied, so the report shows the words it came from.
    write(root, `${CHANGE}/model/examples/timer-holds-${HOLD.slice(-8)}.md`, node(
      { id: HOLD, form: "example", title: "The timer holds while paused", subjects: [PAUSE], provenance: { level: "stated", decided_by: "agent-decided", sources: ["openspec/changes/add-pause/proposal.md · Why"], quote: "a paused game should just quit" } },
      { Given: "a game paused at 01:10", When: "a minute passes", Then: "the clock still shows 01:10" }));
    expect(json(root, ["plan", "add-pause"]).status).toBe(0);
    let report = readFileSync(join(root, CHANGE, "planning.md"), "utf8");
    expect(report).toContain("The timer holds while paused (EX-000000e3) — from “a paused game should just quit” (openspec/changes/add-pause/proposal.md · Why)");
    expect(report).toContain("Game lifecycle (SM-000000s1) — that a finished game can be restarted");
    expect(report).not.toContain("no account of what was supplied");

    // The agent writes what it judged into (c); the next plan measures again and keeps it.
    const finding = "- judged: Quitting asks for confirmation now quits a paused game at once, which the Quit term says a pause does not do.";
    write(root, `${CHANGE}/planning.md`, report.replace("<!-- /kotta:judged -->", `${finding}\n<!-- /kotta:judged -->`));
    const again = json(root, ["plan", "add-pause"]);
    expect(again.body.data.judged).toEqual([finding.slice(2)]);
    report = readFileSync(join(root, CHANGE, "planning.md"), "utf8");
    expect(report.split(finding)).toHaveLength(2);
    expect(report.indexOf(finding)).toBeLessThan(report.indexOf("## (d) Silences"));
    expect(report.indexOf(finding)).toBeGreaterThan(report.indexOf("## (c) Conflict candidates"));
  });

  test("passes once the question is answered, and fails on a structural gap in the delta", () => {
    const root = planningWorkspace("plan-ok");
    answerPause(root);
    expect(json(root, ["plan", "add-pause"]).status).toBe(0);

    // The new rule's example leaves the delta: the rule answers its evidence edge nowhere.
    write(root, `${CHANGE}/model/examples/timer-holds-${HOLD.slice(-8)}.md`, "");
    const broken = json(root, ["plan", "add-pause"]);
    expect(broken.status).toBe(1);
    expect(broken.body.data.structure.map((issue: { code: string }) => issue.code)).toContain("SPEC_NODE_MISSING_EDGE");
    expect(broken.body.data.silences.formQuestions.map((issue: { message: string }) => issue.message).join("\n")).toContain("What would break if this rule were violated?");
  });

  test("a removal an accepted node still depends on fails the merged view and is named as a candidate", () => {
    const root = planningWorkspace("plan-removed");
    answerPause(root);
    write(root, `${CHANGE}/model/REMOVED.md`, `# Removed\n\n- ${PROMPT} — the prompt example goes\n`);
    const planned = json(root, ["plan", "add-pause"]);
    expect(planned.status).toBe(1);
    expect(planned.body.data.delta.removed.map((item: { id: string }) => item.id)).toEqual([PROMPT]);
    // The accepted goal, untouched by the change, is measured by the example the change removes.
    expect(planned.body.data.merged.map((issue: { code: string; message: string }) => `${issue.code} ${issue.message}`).join("\n")).toContain("SPEC_NODE_DANGLING_EDGE finish-games");
    expect(planned.body.data.conflicts).toContainEqual(expect.objectContaining({ kind: "references-removed", detail: "names the removed node in 'measured_by'" }));
  });
});

describe("kotta approve, the one human gate (BR-01m0f0wn89zb3wfb3t3y4d20a7)", () => {
  test("refuses with the exact list: no report, an open decision, a report older than the model", () => {
    const root = planningWorkspace("approve-refusals");
    const first = json(root, ["approve", "add-pause", "--by", "Ada"]);
    expect(first.status).toBe(1);
    expect(first.body.errors?.map((error) => error.code)).toEqual(["PLANNING_MISSING", "OPEN_DECISION"]);
    expect(first.body.errors?.[1].message).toContain("How long may a pause last?");

    run(root, ["plan", "add-pause"]);
    answerPause(root);
    touchLater(join(root, `${CHANGE}/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`));
    const stale = json(root, ["approve", "add-pause", "--by", "Ada"]);
    expect(stale.status).toBe(1);
    expect(stale.body.errors?.map((error) => error.code)).toEqual(["PLANNING_STALE"]);
    expect(existsSync(join(root, CHANGE, "approval.yaml"))).toBe(false);
  });

  test("refuses a delta whose structure does not validate", () => {
    const root = planningWorkspace("approve-invalid");
    answerPause(root);
    write(root, `${CHANGE}/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, node(
      { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", capability: "game/session" },
      { Rule: "While a game is paused its clock SHALL NOT advance.", Rationale: "A pause is not play.", Scope: "Timed games." }));
    run(root, ["plan", "add-pause"]);
    const refused = json(root, ["approve", "add-pause", "--by", "Ada"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors?.map((error) => error.code)).toEqual(["SPEC_NODE_PROVENANCE"]);
  });

  test("records who, when and on what basis — the delta's hash — and names what was approved by title (EX-01m0f0wn8am4hb2vy03wmn4brs)", () => {
    const root = planningWorkspace("approve");
    answerPause(root);
    const planned = json(root, ["plan", "add-pause"]);
    const approved = run(root, ["approve", "add-pause", "--by", "Ada"]);
    expect(approved.status).toBe(0);
    expect(approved.stdout).toContain("Recorded Ada's approval of add-pause");
    expect(approved.stdout).toContain("added   Pause freezes the timer (BR-000000b2)");
    expect(approved.stdout).toContain("changed Game lifecycle (SM-000000s1)");

    const receipt = parse(readFileSync(join(root, CHANGE, "approval.yaml"), "utf8")) as Record<string, any>;
    expect(receipt).toMatchObject({ change: "add-pause", approved_by: "Ada", approval_basis: planned.body.data.deltaHash });
    expect(Number.isFinite(Date.parse(receipt.approved_at))).toBe(true);
    expect(receipt.approved.added.map((item: { title: string }) => item.title).sort()).toEqual(["Pause freezes the timer", "The timer holds while paused"]);
    expect(receipt.approved.changed.map((item: { title: string }) => item.title).sort()).toEqual(["Game lifecycle", "Quitting asks for confirmation"]);
  });
});

function approvedWorkspace(label: string): string {
  const root = planningWorkspace(label);
  answerPause(root);
  expect(run(root, ["plan", "add-pause"]).status).toBe(0);
  expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
  return root;
}

describe("kotta archive", () => {
  test("refuses without an approval, and refuses a delta edited after the yes (BR-01m0f0wn89zb3wfb3t3y4d20a7)", () => {
    const root = planningWorkspace("archive-unapproved");
    const refused = json(root, ["archive", "add-pause"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors?.map((error) => error.code)).toContain("APPROVAL_MISSING");

    const approved = approvedWorkspace("archive-stale");
    write(approved, `${CHANGE}/model/examples/timer-holds-${HOLD.slice(-8)}.md`, node(
      { id: HOLD, form: "example", title: "The timer holds while paused", subjects: [PAUSE], provenance: { level: "inferred", decided_by: "agent-decided", sources: [], inferred: "the minute" } },
      { Given: "a paused game", When: "an hour passes", Then: "the clock has not moved" }));
    const stale = json(approved, ["archive", "add-pause"]);
    expect(stale.status).toBe(1);
    expect(stale.body.errors?.map((error) => error.code)).toEqual(["APPROVAL_STALE"]);
    expect(existsSync(join(approved, CHANGE))).toBe(true);
  });

  test("merges the delta, regenerates the capability's narrative from the model, and moves the change to the archive", () => {
    const root = approvedWorkspace("archive");
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect(archived.body.data.drift).toEqual([]);

    // Same id replaced, new nodes added.
    const quit = matter(readFileSync(join(root, `.kotta/spec/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`), "utf8"));
    expect(quit.content).toContain(QUIT_RULE_AFTER);
    expect(quit.data.provenance).toMatchObject({ level: "stated", decided_by: "human" });
    expect(existsSync(join(root, `.kotta/spec/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`))).toBe(true);
    expect(existsSync(join(root, `.kotta/spec/examples/timer-holds-${HOLD.slice(-8)}.md`))).toBe(true);
    expect(json(root, ["validate"]).body).toMatchObject({ ok: true, data: { specNodes: 8 } });

    // The narrative, generated in OpenSpec form, says exactly what the model says.
    const narrative = readFileSync(join(root, "openspec/specs/game/session/spec.md"), "utf8");
    expect(archived.body.data.narratives).toEqual(["openspec/specs/game/session/spec.md"]);
    expect(narrative).toContain("## Purpose\n\n<!-- kotta: G-01m0p0000000000000000000g1 -->\nFewer games end by accident.");
    expect(narrative).toContain(`### Requirement: Quitting asks for confirmation\n<!-- kotta: ${QUIT} -->\n${QUIT_RULE_AFTER}`);
    expect(narrative).toContain(`#### Scenario: The quit prompt appears\n<!-- kotta: ${PROMPT} -->\n- **GIVEN** a running game\n- **WHEN** the player presses Q`);
    expect(narrative).toContain(`#### Scenario: The timer holds while paused\n<!-- kotta: ${HOLD} -->`);
    const bound = boundRequirements(narrative);
    expect(bound.map((requirement) => requirement.id).sort()).toEqual([QUIT, PAUSE].sort());
    const statement = bound.find((requirement) => requirement.id === PAUSE)!.body;
    expect(normalizeProse(statement)).toContain("While a game is paused its clock SHALL NOT advance.");
    expect(normalizeProse(statement)).toContain("**Rationale** A pause is not play.");

    // The change, with its planning report and receipt, lives on in the archive.
    const destination = join(root, `openspec/changes/archive/${today()}-add-pause`);
    expect(existsSync(join(root, CHANGE))).toBe(false);
    for (const file of ["approval.yaml", "planning.md", "proposal.md", "model"]) expect(existsSync(join(destination, file))).toBe(true);
  });

  test("a removed node that an accepted node still names is refused, and nothing is written", () => {
    const root = planningWorkspace("archive-removed");
    answerPause(root);
    write(root, `${CHANGE}/model/REMOVED.md`, `- ${TERM} — the glossary no longer needs it\n`);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);

    // After the yes, another landing makes an accepted node name the term.
    write(root, `.kotta/spec/entities/game-${GAME.slice(-8)}.md`, node(
      { id: GAME, form: "entity", title: "Game", used_by: [QUIT], see_also: [TERM] },
      { Meaning: "One play-through.", Identity: "A session id.", Attributes: "Score, clock.", Invariants: "The clock never runs backwards." }));
    const refused = json(root, ["archive", "add-pause"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors).toEqual([expect.objectContaining({ code: "REMOVED_STILL_REFERENCED", message: expect.stringContaining("'see_also'") })]);
    expect(existsSync(join(root, `.kotta/spec/glossary-terms/quit-${TERM.slice(-8)}.md`))).toBe(true);
    expect(existsSync(join(root, "openspec/specs"))).toBe(false);
    expect(existsSync(join(root, CHANGE))).toBe(true);
  });

  test("a removal nobody depends on deletes the node", () => {
    const root = planningWorkspace("archive-remove-ok");
    answerPause(root);
    write(root, `${CHANGE}/model/REMOVED.md`, `- ${TERM} — the glossary no longer needs it\n`);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect(archived.body.data.removed.map((item: { id: string }) => item.id)).toEqual([TERM]);
    expect(existsSync(join(root, `.kotta/spec/glossary-terms/quit-${TERM.slice(-8)}.md`))).toBe(false);
  });

  test("a hand-edited narrative that disagrees with the model stops the archive, naming both places", () => {
    const root = approvedWorkspace("archive-drift");
    write(root, "openspec/specs/game/rules/spec.md", [
      "# game/rules Specification", "", "## Requirements", "", "### Requirement: Quitting", `<!-- kotta: ${QUIT} -->`, "The game SHALL never ask.", "",
    ].join("\n"));
    const refused = json(root, ["archive", "add-pause"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors).toEqual([expect.objectContaining({ code: "NARRATIVE_DRIFT", message: expect.stringContaining("openspec/specs/game/rules/spec.md:5") })]);
    expect(refused.body.errors?.[0].message).toContain("Quitting asks for confirmation");
    expect(existsSync(join(root, CHANGE))).toBe(true);
    expect(readFileSync(join(root, `.kotta/spec/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`), "utf8")).not.toContain(QUIT_RULE_AFTER);
  });
});
