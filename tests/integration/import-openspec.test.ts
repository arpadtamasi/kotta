import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { NOT_DERIVABLE, parseCapabilitySpec } from "../../src/commands/import.js";
import { markdownFiles } from "../../src/spec/narrative.js";
import { cli, id, json, node, run, write } from "./planning-fixture.js";

/**
 * `kotta import openspec` takes an OpenSpec project in through the planning phase: it drafts what the
 * narrative states — a rule per requirement, an example per scenario, a goal per Purpose — marks every
 * draft stated and agent-decided, invents nothing else, and leaves the narrative as it was. The
 * `specs/migration` scenario "Import után" is what the oktat-ai fixture holds.
 */

const OKTAT_AI = resolve("tests/fixtures/oktat-ai-openspec/specs");

const EXISTING = id("BR", "x1");
const BOUND = id("BR", "x2");

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-import-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

/** Two capabilities, four requirements, six scenarios; one requirement shares its title with an accepted rule. */
function smallProject(label: string): string {
  const root = repository(label);
  write(root, "openspec/specs/game/session/spec.md", [
    "# game/session Specification", "",
    "## Purpose", "Players finish the games they start. Nobody loses a game by accident.", "",
    "## Requirements", "",
    "### Requirement: Quitting asks for confirmation",
    "The game SHALL ask “Quit? Y/N” before it ends a running game.", "",
    "#### Scenario: The quit prompt appears",
    "- **GIVEN** a running game",
    "- **WHEN** the player presses Q",
    "- **THEN** the game asks “Quit? Y/N”",
    "- **AND** the clock stops", "",
    "#### Scenario: No means no",
    "- **WHEN** the player answers N",
    "- **THEN** the game goes on", "",
    "### Requirement: Pause freezes the timer",
    "While a game is paused its clock SHALL NOT advance.", "",
    "#### Scenario: The timer holds",
    "- **WHEN** a paused game waits a minute",
    "- **THEN** the clock shows the same time", "",
  ].join("\n"));
  write(root, "openspec/specs/scores/spec.md", [
    "# scores Specification", "",
    "## Purpose", "Scores are kept honestly.", "",
    "## Requirements", "",
    "### Requirement: A score never decreases",
    "A player's score SHALL NOT decrease during a game.", "",
    "#### Scenario: A penalty",
    "- **WHEN** a penalty applies",
    "- **THEN** the next point is withheld,", "  and the score stays", "",
    "### Requirement: High scores are kept",
    "The ten highest scores SHALL be kept across sessions.", "",
    "#### Scenario: A new high score",
    "- **WHEN** a game ends with a score above the tenth",
    "- **THEN** it enters the table", "",
    "#### Scenario: A low score",
    "- **WHEN** a game ends with a score below the tenth",
    "- **THEN** the table is unchanged", "",
  ].join("\n"));
  write(root, `.kotta/spec/business-rules/quit-confirmation-${EXISTING.slice(-8)}.md`, node(
    { id: EXISTING, form: "business-rule", title: "Quitting asks for confirmation", capability: "game/session" },
    { Rule: "The game SHALL ask before it quits.", Rationale: "An accidental quit loses the game.", Scope: "Every running game." }));
  return root;
}

function modelNodes(root: string, change: string) {
  return markdownFiles(join(root, "openspec/changes", change, "model")).map((path) => ({ path, ...matter(readFileSync(path, "utf8")) }));
}

describe("parsing an OpenSpec capability spec", () => {
  test("reads the purpose, the requirements with their bindings, and the scenario steps", () => {
    const parsed = parseCapabilitySpec([
      "# x Specification", "", "## Purpose", "Why x exists.", "", "## Requirements", "",
      "### Requirement: One", `<!-- kotta: ${BOUND} -->`, "It SHALL hold.", "", "```", "### Requirement: not a heading", "```", "",
      "#### Scenario: Case", "- **GIVEN** a", "- **AND** b", "- **WHEN** c", "  continued", "- **THEN** d", "",
    ].join("\n"));
    expect(parsed.purpose).toBe("Why x exists.");
    expect(parsed.requirements).toHaveLength(1);
    expect(parsed.requirements[0]).toMatchObject({ title: "One", binding: BOUND });
    expect(parsed.requirements[0].text).toContain("### Requirement: not a heading");
    expect(parsed.requirements[0].scenarios).toEqual([expect.objectContaining({ title: "Case", given: ["a", "b"], when: ["c continued"], then: ["d"] })]);
  });
});

describe("kotta import openspec", () => {
  test("drafts a rule per requirement, an example per scenario and a goal per purpose, all stated and agent-decided", () => {
    const root = smallProject("small");
    const narrative = markdownFiles(join(root, "openspec/specs")).map((file) => readFileSync(file, "utf8"));
    const imported = json(root, ["import", "openspec", "--change", "import-game"]);
    expect(imported.status).toBe(0);
    const data = imported.body.data;
    expect(data.capabilities.map((item: { capability: string }) => item.capability)).toEqual(["game/session", "scores"]);
    expect(data.drafted).toEqual({ rules: 4, examples: 6, goals: 2 });
    expect(data.decidedBy).toBe("agent-decided");
    expect(data.notDerived).toEqual(["actor", "use-case", "entity", "state-machine"]);

    const nodes = modelNodes(root, "import-game");
    expect(nodes).toHaveLength(12);
    for (const item of nodes) {
      expect(item.data.provenance).toMatchObject({ level: "stated", decided_by: "agent-decided" });
      expect(item.data.provenance.sources[0]).toMatch(/^openspec\/specs\/(game\/session|scores)\/spec\.md · (Purpose|Requirement: )/);
    }
    // Nothing the narrative does not state: no actor, use case, entity or state machine was drafted.
    expect(new Set(nodes.map((item) => item.data.form))).toEqual(new Set(["business-rule", "example", "goal"]));

    // The rule is the requirement's text; what the narrative does not say is left empty, with the note.
    const pause = nodes.find((item) => item.data.title === "Pause freezes the timer")!;
    expect(pause.data.capability).toBe("game/session");
    expect(pause.content).toContain("## Rule\n\nWhile a game is paused its clock SHALL NOT advance.");
    expect(pause.content).toContain(`## Rationale\n\n${NOT_DERIVABLE}`);
    expect(pause.data.provenance.quote).toBe("While a game is paused its clock SHALL NOT advance.");

    const prompt = nodes.find((item) => item.data.title === "The quit prompt appears")!;
    expect(prompt.data.subjects).toEqual([EXISTING]);
    expect(prompt.content).toContain("## Then\n\n- the game asks “Quit? Y/N”\n- the clock stops");
    const penalty = nodes.find((item) => item.data.title === "A penalty")!;
    expect(penalty.content).toContain("## Then\n\nthe next point is withheld, and the score stays");
    expect(penalty.content).toContain(`## Given\n\n${NOT_DERIVABLE}`);

    const goal = nodes.find((item) => item.data.form === "goal" && item.data.capability === "scores")!;
    expect(goal.content).toContain("## Outcome\n\nScores are kept honestly.");

    // The narrative is only read.
    expect(markdownFiles(join(root, "openspec/specs")).map((file) => readFileSync(file, "utf8"))).toEqual(narrative);

    const proposal = readFileSync(join(root, "openspec/changes/import-game/proposal.md"), "utf8");
    expect(proposal).toContain("2 capabilities, 4 requirements, 6 scenarios");
    expect(proposal).toContain("Not drafted: actors, use cases, entities and state machines.");
  });

  test("a requirement titled like an accepted rule changes that rule under its own id, keeping what the narrative does not say", () => {
    const root = smallProject("collide");
    const imported = json(root, ["import", "openspec", "--change", "import-game"]);
    expect(imported.body.data.modified).toEqual([expect.objectContaining({ id: EXISTING, title: "Quitting asks for confirmation" })]);
    expect(imported.body.data.added).toHaveLength(11);

    const nodes = modelNodes(root, "import-game");
    const rules = nodes.filter((item) => item.data.title === "Quitting asks for confirmation");
    expect(rules).toHaveLength(1);
    expect(rules[0].path).toBe(join(root, `openspec/changes/import-game/model/business-rules/quit-confirmation-${EXISTING.slice(-8)}.md`));
    expect(rules[0].content).toContain("## Rule\n\nThe game SHALL ask “Quit? Y/N” before it ends a running game.");
    expect(rules[0].content).toContain("## Rationale\n\nAn accidental quit loses the game.");
    // The accepted specification itself is untouched.
    expect(readFileSync(join(root, `.kotta/spec/business-rules/quit-confirmation-${EXISTING.slice(-8)}.md`), "utf8")).toContain("The game SHALL ask before it quits.");

    const planned = json(root, ["plan", "import-game"]);
    expect(planned.body.data.delta.modified.map((item: { id: string }) => item.id)).toEqual([EXISTING]);
    expect(planned.body.data.delta.added).toHaveLength(11);
  });

  test("a requirement bound to an accepted node changes that node, whatever its title", () => {
    const root = repository("bound");
    write(root, `.kotta/spec/business-rules/old-name-${BOUND.slice(-8)}.md`, node(
      { id: BOUND, form: "business-rule", title: "Old name" },
      { Rule: "Old text.", Rationale: "Kept.", Scope: "Kept." }));
    write(root, "openspec/specs/x/spec.md", ["# x Specification", "", "## Purpose", "X.", "", "## Requirements", "", "### Requirement: New name", `<!-- kotta: ${BOUND} -->`, "New text SHALL hold.", ""].join("\n"));
    const imported = json(root, ["import", "openspec"]);
    expect(imported.body.data.change).toBe(`import-openspec-${new Date().toISOString().slice(0, 10)}`);
    expect(imported.body.data.modified).toEqual([expect.objectContaining({ id: BOUND })]);
    expect(imported.body.data.drafted.rules).toBe(1);
  });

  test("says the planning phase comes next, and refuses to overwrite a change", () => {
    const root = smallProject("text");
    const first = run(root, ["import", "openspec", "--change", "import-game"]);
    expect(first.status).toBe(0);
    expect(first.stdout).toContain("4 rule, 6 example and 2 goal drafts");
    expect(first.stdout).toContain("all agent-decided");
    expect(first.stdout).toContain("Run the plan-change skill on import-game");
    expect(first.stdout).toContain("'kotta plan import-game'");

    const again = run(root, ["import", "openspec", "--change", "import-game"]);
    expect(again.status).toBe(1);
    expect(again.stderr).toContain("already exists");
  });

  test("refuses a repository with no OpenSpec capability spec", () => {
    const root = repository("empty");
    const refused = run(root, ["import", "openspec"]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain("No OpenSpec capability spec was found");
    expect(existsSync(join(root, "openspec/changes"))).toBe(false);
  });
});

describe("import after: the oktat-ai narrative spec", () => {
  test("112 rules, 226 examples and 12 goals, all agent-decided; plan measures them and the planning phase follows", () => {
    const root = repository("oktat-ai");
    cpSync(OKTAT_AI, join(root, "openspec/specs"), { recursive: true });
    const before = markdownFiles(join(root, "openspec/specs")).map((file) => readFileSync(file, "utf8"));

    const imported = json(root, ["import", "openspec", "--change", "import-oktat-ai"]);
    expect(imported.status).toBe(0);
    const data = imported.body.data;
    expect(data.capabilities).toHaveLength(12);
    expect(data.capabilities.reduce((sum: number, item: { requirements: number }) => sum + item.requirements, 0)).toBe(112);
    expect(data.capabilities.reduce((sum: number, item: { scenarios: number }) => sum + item.scenarios, 0)).toBe(226);
    expect(data.drafted).toEqual({ rules: 112, examples: 226, goals: 12 });
    expect(data.added).toHaveLength(350);
    expect(data.modified).toEqual([]);

    const planned = json(root, ["plan", "import-oktat-ai"]);
    expect(planned.body.data.delta.added).toHaveLength(350);
    expect(planned.body.data.provenance).toMatchObject({ nodes: 350, unmarked: [], levels: { stated: 350, "partly-inferred": 0, inferred: 0 }, decidedBy: { human: 0, "agent-proposed-human-approved": 0, "agent-decided": 350 } });
    expect(planned.body.data.provenance.machineDecisions).toHaveLength(350);
    // Not ready: the planning phase has yet to answer what the narrative does not say.
    expect(planned.status).toBe(1);
    const codes = new Set(planned.body.data.structure.map((issue: { code: string }) => issue.code));
    expect(codes).toEqual(new Set(["SPEC_NODE_MISSING_SECTION", "SPEC_NODE_MISSING_EDGE"]));
    expect(planned.body.data.drift).toEqual([]);

    expect(markdownFiles(join(root, "openspec/specs")).map((file) => readFileSync(file, "utf8"))).toEqual(before);
    expect(readdirSync(join(root, "openspec/changes/import-oktat-ai/model")).sort()).toEqual(["business-rules", "examples", "goals"]);
  });
});

/**
 * The import drafts nothing from a comment (BR-01m3cqmtnnwxz7fkyr6d5ch9e6). The generator writes a
 * comment into the Purpose of a capability no goal names; read as prose, it became a goal.
 */
describe("the import drafts nothing from a comment (BR-01m3cqmtnnwxz7fkyr6d5ch9e6)", () => {
  const GENERATED_PURPOSE = "<!-- kotta: no goal node names this capability, so the model states no purpose for it. -->";

  test("a comment-only Purpose drafts no goal, and the capability is named as one whose purpose is not stated (EX-01m3cqmvz6thtctkdd760f1n2b)", () => {
    const root = repository("comment-purpose");
    write(root, "openspec/specs/ledger/spec.md", [
      "# ledger Specification", "", "<!-- Generated by `kotta archive` from the technical model. -->", "",
      "## Purpose", "", GENERATED_PURPOSE, "",
      "## Requirements", "",
      "### Requirement: Entries balance", "Every entry SHALL balance.", "",
      "#### Scenario: A balanced entry", "- **WHEN** an entry is posted", "- **THEN** debits equal credits", "",
    ].join("\n"));
    expect(parseCapabilitySpec(readFileSync(join(root, "openspec/specs/ledger/spec.md"), "utf8")).purpose).toBe("");

    const imported = json(root, ["import", "openspec", "--change", "import-ledger"]);
    expect(imported.status).toBe(0);
    expect(imported.body.data.drafted).toEqual({ rules: 1, examples: 1, goals: 0 });
    expect(modelNodes(root, "import-ledger").filter((item) => item.data.form === "goal")).toEqual([]);
    const warning = (imported.body.data.warnings as string[]).find((entry) => entry.includes("purpose is not stated"));
    expect(warning, "the capability is named among the warnings").toMatch(/^ledger: the purpose is not stated/);
    expect(readFileSync(join(root, "openspec/changes/import-ledger/proposal.md"), "utf8")).toContain("ledger: the purpose is not stated");
  });

  test("a comment-only scenario drafts no example, and a warning names the capability and the scenario (EX-01m3f1eax7v7xsq6zfsk087v74)", () => {
    const root = repository("comment-scenario");
    write(root, "openspec/specs/ledger/spec.md", [
      "# ledger Specification", "", "## Purpose", "The books are kept straight.", "",
      "## Requirements", "",
      "### Requirement: Entries balance", "Every entry SHALL balance.", "",
      "#### Scenario: A balanced entry", "- **WHEN** an entry is posted", "- **THEN** debits equal credits", "",
      "#### Scenario: Not written yet", "<!-- to be agreed with finance -->", "",
      "### Requirement: Only a comment", "<!-- the requirement text is still being drafted -->", "",
    ].join("\n"));

    const imported = json(root, ["import", "openspec", "--change", "import-ledger"]);
    expect(imported.status).toBe(0);
    expect(imported.body.data.drafted).toEqual({ rules: 1, examples: 1, goals: 1 });
    const titles = modelNodes(root, "import-ledger").map((item) => item.data.title);
    expect(titles).not.toContain("Not written yet");
    expect(titles).not.toContain("Only a comment");
    const warnings = imported.body.data.warnings as string[];
    expect(warnings).toContainEqual(expect.stringMatching(/^ledger: .*Requirement: Entries balance \/ Scenario: Not written yet has no text/));
    expect(warnings).toContainEqual(expect.stringMatching(/^ledger: .*Requirement: Only a comment has no text/));
    expect(warnings.join("\n")).not.toContain("finance");
  });

  test("a Purpose with prose and a comment drafts its goal from the prose alone (EX-01m3cqmw5eyqbr0bt3wcrazx8g)", () => {
    const root = repository("prose-purpose");
    write(root, "openspec/specs/ledger/spec.md", [
      "# ledger Specification", "",
      "## Purpose", "", "The books are kept straight.", "", "<!-- reviewer: confirm with finance -->", "",
      "## Requirements", "",
      "### Requirement: Entries balance", "Every entry SHALL balance. <!-- inline aside -->", "",
      "#### Scenario: A balanced entry", "- **WHEN** an entry is posted <!-- step aside -->", "- **THEN** debits equal credits", "",
    ].join("\n"));

    const imported = json(root, ["import", "openspec", "--change", "import-ledger"]);
    expect(imported.status).toBe(0);
    expect(imported.body.data.drafted).toEqual({ rules: 1, examples: 1, goals: 1 });
    const nodes = modelNodes(root, "import-ledger");
    const goal = nodes.find((item) => item.data.form === "goal")!;
    expect(goal.content).toContain("The books are kept straight.");
    for (const item of nodes) {
      const text = `${item.content}\n${JSON.stringify(item.data)}`;
      expect(text).not.toContain("confirm with finance");
      expect(text).not.toContain("aside");
    }
    expect((imported.body.data.warnings as string[]).some((entry) => entry.includes("purpose is not stated"))).toBe(false);
  });
});
