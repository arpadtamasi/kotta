import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { narrativeShapeWarnings } from "../../src/spec/narrative.js";
import { GAME, QUIT, answerPause, id, json, node, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * The obligation's keyword lives in the model, and the narrative is generated from the model or
 * written by people. A business rule, an interface's postconditions or invariants and a quality
 * attribute's response say SHALL or MUST (OpenSpec's convention, in English in any language): an
 * accepted node without one is a warning, a change's node without one is refused. The generator
 * carries the text as written and invents nothing; what OpenSpec will still call incomplete is said
 * beforehand. `narrative: authored` stops archive writing `openspec/specs` and leaves it to report.
 */

const CHANGE = "openspec/changes/add-pause";
const PAUSE = id("BR", "b2");
const IFACE = id("IF", "f1");
const pauseRule = (rule: string) => node(
  { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", capability: "game/session", provenance: { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] } },
  { Rule: rule, Rationale: "A pause is not play.", Scope: "Timed games.", "Open decisions": "None." });

describe("the normative keyword", () => {
  test("warns on an accepted node, refuses a change's node, and blocks plan", () => {
    const root = planningWorkspace("normative");
    answerPause(root);
    write(root, `.kotta/spec/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`, node(
      { id: QUIT, form: "business-rule", title: "Quitting asks for confirmation", capability: "game/session" },
      { Rule: "A játék megerősítést kér, mielőtt kilép.", Rationale: "An accidental quit loses the game.", Scope: "Every running game." }));
    write(root, `${CHANGE}/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, pauseRule("Szünet alatt az óra nem jár."));

    const validated = json(root, ["validate"]);
    expect(validated.status).toBe(1);
    expect(validated.body.errors).toEqual([expect.objectContaining({ code: "SPEC_NODE_NOT_NORMATIVE", path: expect.stringContaining(`${CHANGE}/model/business-rules/pause-freezes`) })]);
    expect((validated.body as unknown as { warnings: Array<{ code: string; path: string }> }).warnings).toContainEqual(expect.objectContaining({ code: "SPEC_NODE_NOT_NORMATIVE", path: expect.stringContaining(".kotta/spec/business-rules/quit-confirmation") }));

    const planned = json(root, ["plan", "add-pause"]);
    expect(planned.status).toBe(1);
    expect(planned.body.data.structure.map((issue: { code: string }) => issue.code)).toEqual(["SPEC_NODE_NOT_NORMATIVE"]);

    write(root, `${CHANGE}/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, pauseRule("Szünet alatt az óra SHALL NOT járni."));
    expect(json(root, ["plan", "add-pause"]).status).toBe(0);
    const accepted = json(root, ["validate"]);
    expect(accepted.body.ok).toBe(true);
    expect(run(root, ["validate"]).stdout).toContain("Warning: SPEC_NODE_NOT_NORMATIVE: quit-confirmation-000000b1.md (business-rule) states its Rule without SHALL or MUST.");
  });

  test("an interface keeps it in its postconditions or invariants", () => {
    const root = planningWorkspace("normative-interface");
    answerPause(root);
    const iface = (postconditions: string) => node(
      { id: IFACE, form: "interface", title: "Pause command", capability: "game/session", provenance: { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] } },
      { Purpose: "Pauses a running game.", Preconditions: "The game is running.", Postconditions: postconditions, Invariants: "The score is unchanged.", Failures: "A game already paused is refused." });
    write(root, `${CHANGE}/model/interfaces/pause-command-${IFACE.slice(-8)}.md`, iface("The game is paused."));
    const refused = json(root, ["validate"]);
    expect(refused.body.errors).toEqual([expect.objectContaining({ code: "SPEC_NODE_NOT_NORMATIVE", message: expect.stringContaining("Postconditions / Invariants") })]);
    write(root, `${CHANGE}/model/interfaces/pause-command-${IFACE.slice(-8)}.md`, iface("The game SHALL be paused."));
    expect(json(root, ["validate"]).body.ok).toBe(true);
  });

  test("the scaffold asks for it, and its hint alone does not fill the section", () => {
    const root = planningWorkspace("normative-scaffold");
    const created = json(root, ["spec", "new", "business-rule", "--title", "Idle games end", "--into", "add-pause"]);
    expect(created.body.data.normative).toEqual(["Rule"]);
    const draft = readFileSync(join(root, created.body.data.path), "utf8");
    expect(draft).toMatch(/## Rule\n\n<!-- State the obligation with SHALL or MUST[^\n]*-->\n/);
    expect(run(root, ["spec", "new", "business-rule", "--title", "Idle games end too"]).stdout).toContain("State the obligation in Rule with SHALL or MUST");
    const measured = json(root, ["validate"]);
    const messages = (measured.body.errors ?? []).map((error) => `${error.code} ${error.message}`).join("\n");
    expect(messages).toContain("SPEC_NODE_MISSING_SECTION idle-games-end");
    expect(messages).toMatch(/SPEC_NODE_MISSING_SECTION idle-games-end-[a-z0-9]{8}\.md \(business-rule\) is missing or leaves empty the required section 'Rule'/);
  });
});

function approved(label: string, extra?: (root: string) => void): string {
  const root = planningWorkspace(label);
  answerPause(root);
  extra?.(root);
  expect(run(root, ["plan", "add-pause"]).status).toBe(0);
  expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
  return root;
}

describe("the generated narrative", () => {
  test("gives an interface its own contract as the scenario, and says what OpenSpec will still refuse", () => {
    const root = approved("contract", (base) => {
      write(base, `${CHANGE}/model/interfaces/pause-command-${IFACE.slice(-8)}.md`, node(
        { id: IFACE, form: "interface", title: "Pause command", capability: "game/session", provenance: { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] } },
        { Purpose: "Pauses a running game.", Preconditions: "The game is running.", Postconditions: "The game SHALL be paused.", Invariants: "The score is unchanged.", Failures: "A game already paused is refused." }));
      write(base, `${CHANGE}/model/entities/game-${GAME.slice(-8)}.md`, node(
        { id: GAME, form: "entity", title: "Game", used_by: [QUIT], interfaces: [IFACE], provenance: { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] } },
        { Meaning: "One play-through.", Identity: "A session id.", Attributes: "Score, clock.", Invariants: "The clock never runs backwards." }));
    });
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    const narrative = readFileSync(join(root, "openspec/specs/game/session/spec.md"), "utf8");
    expect(narrative).toContain(`#### Scenario: Pause command keeps its contract\n<!-- kotta: ${IFACE} -->\n- **GIVEN** The game is running.\n- **THEN** The game SHALL be paused.`);
    // The goal's outcome is under OpenSpec's fifty characters: said, not padded.
    expect((archived.body as unknown as { warnings: Array<{ code: string }> }).warnings.map((warning) => warning.code)).toEqual(["NARRATIVE_PURPOSE_BRIEF"]);
    expect(narrative).toContain("Fewer games end by accident.");
  });

  test("names a requirement without a scenario and a brief purpose", () => {
    const warnings = narrativeShapeWarnings("spec.md", ["# x", "", "## Purpose", "", "Short.", "", "## Requirements", "", "### Requirement: A", "Text SHALL.", "", "### Requirement: B", "Text SHALL.", "", "#### Scenario: b", "- **THEN** ok", ""].join("\n"));
    expect(warnings.map((warning) => warning.code)).toEqual(["NARRATIVE_PURPOSE_BRIEF", "NARRATIVE_NO_SCENARIO"]);
    expect(warnings[1].message).toContain("spec.md:9 requirement 'A'");
  });
});

describe("narrative: authored", () => {
  const drifting = ["# game/rules Specification", "", "## Requirements", "", "### Requirement: Quitting", `<!-- kotta: ${QUIT} -->`, "The game SHALL never ask.", ""].join("\n");

  test("archive writes no narrative and reports the drift without stopping", () => {
    const root = approved("authored");
    appendFileSync(join(root, ".kotta/config.yaml"), "narrative: authored\n");
    write(root, "openspec/specs/game/rules/spec.md", drifting);
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect(archived.body.data).toMatchObject({ narrative: "authored", narratives: [] });
    expect(archived.body.data.drift).toEqual([expect.objectContaining({ id: QUIT, kind: "changed" })]);
    expect((archived.body as unknown as { warnings: Array<{ code: string }> }).warnings).toEqual([expect.objectContaining({ code: "NARRATIVE_DRIFT" })]);
    expect(existsSync(join(root, "openspec/specs/game/session/spec.md"))).toBe(false);
    expect(readFileSync(join(root, "openspec/specs/game/rules/spec.md"), "utf8")).toBe(drifting);
    expect(existsSync(join(root, CHANGE))).toBe(false);
  });

  test("is read from openspec/config.yaml as well, and an unknown value is refused", () => {
    const root = approved("authored-openspec");
    write(root, "openspec/config.yaml", "schema: spec-driven\nnarrative: authored\n");
    const text = run(root, ["archive", "add-pause"]);
    expect(text.status).toBe(0);
    expect(text.stdout).toContain("The narrative is authored, so openspec/specs was not written");
    expect(existsSync(join(root, "openspec/specs/game/session/spec.md"))).toBe(false);

    const refused = approved("authored-invalid");
    appendFileSync(join(refused, ".kotta/config.yaml"), "narrative: handwritten\n");
    const result = json(refused, ["archive", "add-pause"]);
    expect(result.status).toBe(1);
    expect(result.body.errors).toEqual([expect.objectContaining({ code: "CONFIG_INVALID", message: expect.stringContaining("'handwritten'") })]);
  });
});
