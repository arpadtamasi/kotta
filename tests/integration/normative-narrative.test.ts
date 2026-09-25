import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { boundRequirements, narrativeShapeWarnings } from "../../src/spec/narrative.js";
import { GAME, GOAL, PAUSE as PAUSE_RULE, QUIT, answerPause, id, json, node, planningWorkspace, run, write } from "./planning-fixture.js";

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
  const planned = run(root, ["plan", "add-pause"]);
  expect(planned.status, planned.stdout + planned.stderr).toBe(0);
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

  test("describes use cases and user stories after the requirements, never as requirements, and OpenSpec accepts it", () => {
    const ACTOR = id("A", "a1");
    const PLAY = id("UC", "c1");
    const RESUME = id("UC", "c2");
    const STORY = id("US", "s2");
    const QA = id("QA", "q1");
    const stated = { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] };
    const at = (form: string, slug: string, key: string) => `${CHANGE}/model/${form}/${slug}-${key.slice(-8)}.md`;
    const example = (key: string, title: string, subjects: string[], when: string) => write(root, at("examples", title.toLowerCase().replace(/\W+/g, "-"), key), node(
      { id: key, form: "example", title, subjects, provenance: stated }, { Given: "a running game", When: when, Then: "the game answers at once" }));
    let root = "";
    root = approved("informative", (base) => {
      root = base;
      write(base, at("goals", "finish-games", GOAL), node(
        { id: GOAL, form: "goal", title: "Players finish the games they start", capability: "game/session", measured_by: [id("EX", "e1")], provenance: stated },
        { Outcome: "Fewer games end by accident: a player who starts a game sees it through to its end.", Context: "Players quit by mistake.", "Baseline and target": "From 12% accidental quits to 2%." }));
      write(base, at("actors", "player", ACTOR), node({ id: ACTOR, form: "actor", title: "Player", provenance: stated }, { Role: "Plays a game.", Goals: "Finish it.", Responsibilities: "Pauses and resumes." }));
      write(base, at("interfaces", "pause-command", IFACE), node(
        { id: IFACE, form: "interface", title: "Pause command", capability: "game/session", provenance: stated },
        { Purpose: "Pauses a running game.", Preconditions: "The game is running.", Postconditions: "The game SHALL be paused.", Invariants: "The score is unchanged.", Failures: "A game already paused is refused." }));
      write(base, at("entities", "game", GAME), node(
        { id: GAME, form: "entity", title: "Game", used_by: [QUIT], interfaces: [IFACE], provenance: stated },
        { Meaning: "One play-through.", Identity: "A session id.", Attributes: "Score, clock.", Invariants: "The clock never runs backwards." }));
      write(base, at("quality-attributes", "pause-latency", QA), node(
        { id: QA, form: "quality-attribute", title: "Pause is immediate", capability: "game/session", provenance: stated },
        { Source: "A player.", Stimulus: "Presses P.", Environment: "A running game.", Artifact: "The game loop.", Response: "The clock SHALL stop within one frame.", Measure: "16 ms." }));
      for (const [key, title, intent] of [[PLAY, "Play a game", "The player plays a game to its end."], [RESUME, "Resume a paused game", "The player picks a paused game up again."]] as const) {
        write(base, at("use-cases", title.toLowerCase().replace(/\W+/g, "-"), key), node(
          { id: key, form: "use-case", title, capability: "game/session", actor: [ACTOR], goal: [GOAL], interfaces: [IFACE], provenance: stated },
          { Intent: intent, Preconditions: "A game exists.", "Main success scenario": "1. The player starts.\n2. The player finishes.", Alternatives: "- 1a. The player pauses." }));
      }
      write(base, at("user-stories", "pause-a-game", STORY), node(
        { id: STORY, form: "user-story", title: "Pause a game", capability: "game/session", actor: [ACTOR], provenance: stated },
        { Story: "As a player I want to pause, so that I can answer the door.", Value: "No game is lost to the doorbell.", Notes: "Not shown in the narrative." }));
      example(id("EX", "e4"), "The pause answers in a frame", [QA], "the player presses P");
      example(id("EX", "e5"), "A game is played through", [PLAY], "the player plays to the end");
      example(id("EX", "e6"), "A paused game resumes", [RESUME], "the player presses R");
      example(id("EX", "e7"), "The door is answered", [STORY], "the doorbell rings");
      example(id("EX", "e8"), "The pause holds the rule", [RESUME, PAUSE_RULE], "a minute passes");
    });
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect((archived.body as unknown as { warnings: unknown[] }).warnings).toEqual([]);
    const file = join(root, "openspec/specs/game/session/spec.md");
    const narrative = readFileSync(file, "utf8");

    // Section order: Purpose, Requirements (rules, interfaces, quality attributes), then the informative sections.
    const headings = narrative.split("\n").filter((line) => /^#{2,3} /.test(line));
    expect(headings).toEqual([
      "## Purpose", "## Requirements",
      "### Requirement: Pause freezes the timer", "### Requirement: Quitting asks for confirmation",
      "### Requirement: Pause command", "### Requirement: Pause is immediate",
      "## Use cases", "### Play a game", "### Resume a paused game",
      "## User stories", "### Pause a game",
    ]);
    expect(narrative).not.toMatch(/### Requirement: (Play a game|Resume a paused game|Pause a game)/);
    expect(narrative).toContain(`### Resume a paused game\n<!-- kotta: ${RESUME} -->\n**Intent**\n\nThe player picks a paused game up again.\n\n**Main success scenario**\n\n1. The player starts.\n2. The player finishes.\n\n**Alternatives**\n\n- 1a. The player pauses.\n\n#### Scenario: A paused game resumes`);
    expect(narrative).toContain(`### Pause a game\n<!-- kotta: ${STORY} -->\n**Story**\n\nAs a player I want to pause, so that I can answer the door.\n\n**Value**\n\nNo game is lost to the doorbell.\n\n#### Scenario: The door is answered`);
    expect(narrative).not.toContain("Not shown in the narrative.");
    expect(narrative).not.toContain("A game exists.");
    // An example that proves a requirement is that requirement's scenario only.
    expect(narrative.match(/#### Scenario: The pause holds the rule/g)).toHaveLength(1);
    expect(narrative.indexOf("#### Scenario: The pause holds the rule")).toBeLessThan(narrative.indexOf("## Use cases"));

    // The drift check reads requirements only: the informative entries are bound for the board, not compared.
    expect(boundRequirements(narrative).map((requirement) => requirement.id).sort()).toEqual([PAUSE_RULE, QUIT, IFACE, QA].sort());
    expect(json(root, ["validate"]).body.ok).toBe(true);

    // OpenSpec's own strict validation, when the CLI is installed: the informative sections are not requirements to it.
    const probe = spawnSync("openspec", ["--version"], { encoding: "utf8" });
    if (probe.status === 0) {
      const copy = mkdtempSync(join(tmpdir(), "kotta-openspec-strict-"));
      cpSync(join(root, "openspec/specs"), join(copy, "openspec/specs"), { recursive: true });
      const strict = spawnSync("openspec", ["validate", "--specs", "--strict", "--json", "--no-interactive"], { cwd: copy, encoding: "utf8" });
      expect(strict.status, strict.stdout + strict.stderr).toBe(0);
      const shown = JSON.parse(spawnSync("openspec", ["show", "game/session", "--type", "spec", "--json", "--no-interactive"], { cwd: copy, encoding: "utf8" }).stdout) as { requirementCount: number };
      expect(shown.requirementCount).toBe(4);
    }
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
