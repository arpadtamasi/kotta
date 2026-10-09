// The intimity specification's structure as reviewed on 2026-10-09, reduced to what the goal tree
// and the journeys read: goals, actors, use cases, and the edges between them. `flat` is the shape
// the OpenSpec import left (eight sibling goals, no journey); `told` adds the hypothetical purpose
// and journey the spec-hierarchiaja examples illustrate — not intimity's own decided intent.
import type { StructureNode } from "../../../src/spec/structure.js";

const id = (prefix: string, tail: string) => `${prefix}-01m4gh${"0".repeat(20 - tail.length)}${tail}`;

export const IDS = {
  player: id("A", "a1"), visitor: id("A", "a2"),
  couple: id("G", "g1"), round: id("G", "g2"), honest: id("G", "g3"), result: id("G", "g4"),
  apart: id("G", "g5"), discreet: id("G", "g6"), install: id("G", "g7"), account: id("G", "g8"),
  purpose: id("G", "g9"),
  pair: id("UC", "c1"), deal: id("UC", "c2"), choose: id("UC", "c3"), wait: id("UC", "c4"), see: id("UC", "c5"),
  playApart: id("UC", "c6"), discreetly: id("UC", "c7"), homeScreen: id("UC", "c8"), signIn: id("UC", "c9"), signOut: id("UC", "ca"),
  evening: id("UC", "cb"),
};

const goal = (key: string, title: string, serves: string[] = []): StructureNode => ({ id: key, form: "goal", title, edges: { serves } });
const useCase = (key: string, title: string, actor: string, goals: string[], more: Partial<StructureNode["edges"]> = {}, level = "user-goal"): StructureNode =>
  ({ id: key, form: "use-case", title, level, edges: { actor: [actor], goal: goals, includes: [], extends: [], ...more } });

export function flat(): StructureNode[] {
  const { player, visitor } = IDS;
  return [
    { id: player, form: "actor", title: "Player", edges: {} },
    { id: visitor, form: "actor", title: "Visitor", edges: {} },
    goal(IDS.couple, "Two accounts become one private couple"),
    goal(IDS.round, "Both phones play one shared round, each on the side that fits their evening"),
    goal(IDS.honest, "Each partner can answer honestly, in private"),
    goal(IDS.result, "The result reveals mutual interest, never one-sided vulnerability"),
    goal(IDS.apart, "An evening apart can still be played"),
    goal(IDS.discreet, "The app can be used where someone could glance over a shoulder"),
    goal(IDS.install, "The app is opened from the home screen like an app"),
    goal(IDS.account, "Each person's couple and round are reached only through their own account"),
    useCase(IDS.pair, "Pair with a partner through an invitation", player, [IDS.couple]),
    useCase(IDS.deal, "Deal or join tonight's round", player, [IDS.round]),
    useCase(IDS.choose, "Choose a side and answer the cards", player, [IDS.honest]),
    useCase(IDS.wait, "Wait for the partner", player, [IDS.honest]),
    useCase(IDS.see, "See the shared result", player, [IDS.result]),
    useCase(IDS.playApart, "Play an evening apart", player, [IDS.apart], { extends: [IDS.deal] }),
    useCase(IDS.discreetly, "Use the app discreetly", player, [IDS.discreet]),
    useCase(IDS.homeScreen, "Keep the app on the home screen", player, [IDS.install]),
    useCase(IDS.signIn, "Sign in", visitor, [IDS.account]),
    useCase(IDS.signOut, "Sign out", player, [IDS.account]),
  ];
}

/** The flat model with a purpose every goal serves, and the journey *Spend an evening together*. */
export function told(): StructureNode[] {
  const nodes = flat().map((node) => node.form === "goal" ? { ...node, edges: { serves: [IDS.purpose] } } : node);
  return [
    ...nodes,
    goal(IDS.purpose, "Find an evening both welcome, without one-sided vulnerability"),
    useCase(IDS.evening, "Spend an evening together", IDS.player, [IDS.purpose], { includes: [IDS.pair, IDS.deal, IDS.choose, IDS.wait, IDS.see] }, "summary"),
  ];
}
