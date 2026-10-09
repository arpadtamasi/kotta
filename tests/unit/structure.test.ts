import { describe, expect, test } from "vitest";
import { goalPositions, journeys, onJourney, rootGoals, structureGaps } from "../../src/spec/structure.js";
import { IDS, flat, told } from "../fixtures/intimity-structure/index.js";

/**
 * The structure above the requirements: a goal serves a goal (BR-01m4gg8vnq75d4rkw1e0x1b734), a
 * summary use case tells a journey (BR-01m4ggqbayfx5szaspsvpc7apt), and the gaps the tree and
 * validate name (BR-01m4gg8w19p98hafy5m1q4g452, BR-01m4ggqbgh250jcn09w3t5sxqq).
 */
describe("the structure of a specification", () => {
  test("an evening together tells the intimity journey, in includes order, with the evening apart as a variant (EX-01m4ggqbwcb2045qa1dvtcbk4k)", () => {
    const nodes = told();
    expect(journeys(nodes)).toEqual([{ summary: IDS.evening, steps: [IDS.pair, IDS.deal, IDS.choose, IDS.wait, IDS.see] }]);
    const on = onJourney(nodes);
    for (const step of [IDS.pair, IDS.deal, IDS.choose, IDS.wait, IDS.see, IDS.playApart]) expect(on.has(step)).toBe(true);
    for (const off of [IDS.discreetly, IDS.homeScreen, IDS.signIn, IDS.signOut]) expect(on.has(off)).toBe(false);
  });

  test("goals stand in journey order, the variant's goal right after the step it varies", () => {
    const positions = goalPositions(told());
    const ordered = [IDS.couple, IDS.round, IDS.apart, IDS.honest, IDS.result];
    const at = ordered.map((goal) => positions.get(goal)!);
    expect(at).toEqual([...at].sort((left, right) => left - right));
    expect(positions.has(IDS.discreet)).toBe(false);
  });

  test("a flat import names two gaps: eight goals with no purpose, and the Player's use cases with no journey (EX-01m4gg8x90azvgnb0f5ctm7b4h)", () => {
    const gaps = structureGaps(flat());
    expect(gaps.map((gap) => gap.kind)).toEqual(["root-goals", "no-journey"]);
    expect(rootGoals(flat())).toHaveLength(8);
    expect(gaps[1]).toMatchObject({ kind: "no-journey", actor: IDS.player });
  });

  test("with a purpose and the journey, the structure has no gap (EX-01m4ggqc904qbhpg0j4xrj0gj4)", () => {
    expect(structureGaps(told())).toEqual([]);
  });

  test("a use case off the journey while its goal is on it is named; one with no level counts as user-goal", () => {
    const nodes = told().map((node) => node.id === IDS.evening ? { ...node, edges: { ...node.edges, includes: [IDS.pair, IDS.deal, IDS.choose, IDS.see] } } : node.id === IDS.wait ? { ...node, level: undefined } : node);
    expect(structureGaps(nodes)).toEqual([{ kind: "off-journey", useCase: IDS.wait, goal: IDS.honest }]);
  });
});
