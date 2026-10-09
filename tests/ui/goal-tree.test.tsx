// @vitest-environment jsdom
//
// The tree from its purpose and the drawer that reads in words, on the intimity specification as
// reviewed on 2026-10-09 (spec-hierarchiaja). The purpose and the journey are the change's
// hypothetical illustration, not intimity's decided intent.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { App, ChangeHeader, EntityDrawer, SpecView, readAddress, readBoard, writeAddress, type OpenChange, type SpecNode, type Workspace } from "../../ui/src/App";
import { TreeView } from "../../ui/src/Tree";
import { useCaseDiagram, useCaseGraph } from "../../ui/src/model";
import { IDS, flat, told } from "../fixtures/intimity-structure/index";
import { node, workspace } from "./fixtures";
import type { StructureNode } from "../../src/spec/structure";

afterEach(cleanup);
beforeEach(() => window.history.replaceState(null, "", "/"));

const RULE = "BR-01m4gh0000000000000000r001";
const PROOF_A = "EX-01m4gh0000000000000000x001";
const PROOF_B = "EX-01m4gh0000000000000000x002";
const APART_RULE = "BR-01m4gh0000000000000000r002";

/** The structure fixture as board nodes, with one rule the answering step relies on and its two examples. */
function boardSpec(structure: StructureNode[]): SpecNode[] {
  const nodes = structure.map((item) => node(item.id, item.form, item.title, {
    ...(item.level ? { level: item.level } : {}),
    edges: Object.fromEntries(Object.entries(item.edges).filter(([, ids]) => ids.length)),
    sections: { intent: `${item.title}. More words follow.` },
  }));
  const withRule = nodes.map((entry) => entry.id === IDS.choose ? { ...entry, edges: { ...entry.edges, refines: [RULE] } }
    : entry.id === IDS.playApart ? { ...entry, edges: { ...entry.edges, refines: [APART_RULE] } } : entry);
  return [
    ...withRule,
    node(RULE, "business-rule", "Three private answer choices", { sections: { rule: "Each card is answered yes, curious or pass. The answer stays private." } }),
    node(APART_RULE, "business-rule", "Apart cards ask only for voice and words", { sections: { rule: "No card asks for a photo." } }),
    node(PROOF_A, "example", "Both answer Yes", { edges: { subjects: [RULE] }, sections: { given: "Two partners." } }),
    node(PROOF_B, "example", "Either member passes", { edges: { subjects: [RULE] }, sections: { given: "Two partners." } }),
  ];
}
const board = (structure: StructureNode[], over: Partial<Workspace> = {}) => readBoard(workspace({ spec: boardSpec(structure), ...over }));

describe("the tree from its purpose", () => {
  it("reads from the purpose along the journey, the evening apart right after the deal, support apart (EX-01m4gg8x36bgmg3ebmfzdg5mmf)", () => {
    const { container } = render(<TreeView board={board(told())} onOpen={() => {}} />);
    const strip = container.querySelector(".tree-journeys")!;
    expect([...strip.querySelectorAll(".journey__step")].map((step) => step.textContent)).toEqual([
      "Pair with a partner through an invitation", "Deal or join tonight's round", "Choose a side and answer the cards", "Wait for the partner", "See the shared result",
    ]);
    const goals = [...container.querySelectorAll(".tree-goal__title")].map((title) => title.textContent);
    expect(goals[0]).toBe("Find an evening both welcome, without one-sided vulnerability");
    expect(goals.slice(1, 6)).toEqual([
      "Two accounts become one private couple",
      "Both phones play one shared round, each on the side that fits their evening",
      "An evening apart can still be played",
      "Each partner can answer honestly, in private",
      "The result reveals mutual interest, never one-sided vulnerability",
    ]);
    const apart = container.querySelector(".tree-apart");
    expect(apart).toBeNull();
    // Off-journey goals are nested under the purpose too, after the journey's.
    expect(goals.slice(6)).toEqual(expect.arrayContaining(["The app can be used where someone could glance over a shoulder", "The app is opened from the home screen like an app"]));
    // The summary is one row, its steps not nested under it.
    const summary = container.querySelector(".tree-uc--journey")!;
    expect(summary.textContent).toContain("Spend an evening together");
    expect(summary.textContent).toContain("journey · 5 steps");
    // Examples open on demand under a requirement.
    const rule = screen.getByText("Three private answer choices").closest(".tree-req")!;
    expect(within(rule).getByText("2 examples prove it")).toBeTruthy();
    expect(within(rule).getByText("Both answer Yes")).toBeTruthy();
    // The arrangement by actor is one switch away.
    expect(screen.getByRole("button", { name: "actor" })).toBeTruthy();
  });

  it("draws a use case under two parents once, in full, and refers to it everywhere else (EX-01m4ggqc1zvpsm5ksv2mtcpr6m)", () => {
    const { container } = render(<TreeView board={board(told())} onOpen={() => {}} />);
    const full = container.querySelector(`#tree-${IDS.playApart}`)!;
    expect(full.textContent).toContain("Apart cards ask only for voice and words");
    expect(full.closest(`#tree-${IDS.deal}`)).toBeTruthy();
    const references = [...container.querySelectorAll(".tree-ref")].filter((row) => row.textContent?.includes("Play an evening apart"));
    expect(references).toHaveLength(1);
    expect(references[0].textContent).toContain("shown in full under Both phones play one shared round");
    expect(references[0].querySelector("a")!.getAttribute("href")).toBe(`#tree-${IDS.playApart}`);
  });

  it("names a flat import's two gaps, what closes each, and never says the structure is complete (EX-01m4gg8x90azvgnb0f5ctm7b4h)", () => {
    const { container } = render(<TreeView board={board(flat())} onOpen={() => {}} />);
    const gaps = container.querySelector(".tree-gaps")!;
    expect(gaps.querySelector("h3")!.textContent).toBe("2 gaps in the structure");
    const lines = [...gaps.querySelectorAll("li")].map((line) => line.textContent ?? "");
    expect(lines[0]).toMatch(/^8 goals serve no other goal/);
    expect(lines[0]).toContain("in a change");
    expect(lines[1]).toContain("Player — 9 use cases and no journey. Add a summary use case that includes the steps in order, in a change.");
    expect(lines.some((line) => line.includes("Visitor"))).toBe(false);
    expect(container.textContent).not.toContain("has no gap");
    expect(container.querySelector(".tree-apart .spec-group__head")!.textContent).toMatch(/^Goals — no journey is told yet/);
  });

  it("says in words when the structure has no gap (EX-01m4ggqc904qbhpg0j4xrj0gj4)", () => {
    const { container } = render(<TreeView board={board(told())} onOpen={() => {}} />);
    expect(container.querySelector(".tree-gaps h3")!.textContent).toBe("The structure has no gap: every goal serves one purpose and every journey is told.");
  });

  it("dropping the evening together marks its whole journey, and leaves its goals with no use case (EX-01m4ggxas3te2f5f4h2644eje9)", () => {
    const { container } = render(<TreeView board={board(told())} onOpen={() => {}} />);
    fireEvent.click(within(container.querySelector(".tree-uc--journey") as HTMLElement).getByText("Simulate dropping it"));
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toContain("Simulation — nothing in the specification changes.");
    expect(status).toContain("7 use cases would go");
    for (const id of [IDS.pair, IDS.deal, IDS.choose, IDS.wait, IDS.see, IDS.playApart]) expect(container.querySelector(`#tree-${id}`)!.className).toContain("is-out");
    expect(container.querySelector(`#tree-${IDS.discreetly}`)!.className).not.toContain("is-out");
    const bare = [...container.querySelectorAll(".tree-goal__head")].filter((head) => head.textContent?.includes("left with no use case")).map((head) => head.querySelector("button")!.textContent);
    expect(bare).toContain("Two accounts become one private couple");
    expect(bare).not.toContain("The app can be used where someone could glance over a shoulder");
    expect([...container.querySelectorAll(".tree-req--out")].map((row) => row.textContent).join(" ")).toContain("Three private answer choices");
  });

  it("keeps the off-journey goals in their own nesting: support and infrastructure as two groups (EX-01m4ggxaz5qcvdannbap8r0dek)", () => {
    const PRIVATE = "G-01m4gh0000000000000000gp01";
    const APP = "G-01m4gh0000000000000000gp02";
    const structure = told().map((item) => item.id === IDS.discreet ? { ...item, edges: { serves: [PRIVATE] } }
      : item.id === IDS.install || item.id === IDS.account ? { ...item, edges: { serves: [APP] } } : item);
    structure.push({ id: PRIVATE, form: "goal", title: "Kept private around others", edges: { serves: [] } }, { id: APP, form: "goal", title: "Reachable like an app", edges: { serves: [] } });
    const { container } = render(<TreeView board={board(structure)} onOpen={() => {}} />);
    const apart = container.querySelector(".tree-apart")!;
    expect(apart.querySelector(".spec-group__head")!.textContent).toMatch(/^Off every journey/);
    const kept = [...apart.querySelectorAll(":scope > .tree-goal")];
    expect(kept.map((group) => group.querySelector(".tree-goal__title")!.textContent)).toEqual(["Kept private around others", "Reachable like an app"]);
    expect(kept[0].textContent).toContain("The app can be used where someone could glance over a shoulder");
    expect(kept[1].textContent).toContain("The app is opened from the home screen like an app");
    expect(kept[1].textContent).toContain("Each person's couple and round are reached only through their own account");
  });
});

describe("the drawer reads in words", () => {
  it("shows a rule's text first, its place, the use case it is part of and its proofs, and steps back (EX-01m4gg8xfhm8raymbdwy1b3tmj)", () => {
    const opened = vi.fn();
    const back = vi.fn();
    const { container } = render(<EntityDrawer id={RULE} board={board(told())} onClose={() => {}} onOpen={opened} canGoBack onBack={back} />);
    const order = [...container.querySelectorAll(".drawer__place, .drawer__section-head")].map((element) => element.textContent);
    expect(order[0]).toContain("Find an evening both welcome");
    expect(order[0]).toContain("Each partner can answer honestly, in private");
    expect(order[0]).toContain("Choose a side and answer the cards");
    expect(order.indexOf("Rule")).toBeLessThan(order.indexOf("Relations"));
    const relations = screen.getByText("Relations").closest("section")!;
    expect(within(relations).getByText("Part of")).toBeTruthy();
    expect(within(relations).getByText("Proven by")).toBeTruthy();
    expect(relations.textContent).not.toMatch(/refines|subjects|Answered by/);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(back).toHaveBeenCalled();
  });

  it("names an edge of a project's own form by its field (EX-01m4ggqcmnpc67n7k0bte54kd5)", () => {
    const RISK = "RK-01m4gh0000000000000000k001";
    const spec = [...boardSpec(told()), node(RISK, "risk", "A partner feels pressured", { edges: { threatens: [RULE] } })];
    render(<EntityDrawer id={RISK} board={readBoard(workspace({ spec }))} onClose={() => {}} onOpen={() => {}} />);
    const relations = screen.getByText("Relations").closest("section")!;
    expect(within(relations).getByText("threatens")).toBeTruthy();
  });

  it("shows a related node's title and first sentence on pointing, keeping the open node (EX-01m4ghr97pebezq1r7qmwzrtgt)", () => {
    render(<EntityDrawer id={IDS.choose} board={board(told())} onClose={() => {}} onOpen={() => {}} />);
    const ref = screen.getAllByRole("button", { name: /Three private answer choices/ }).find((button) => button.className.includes("spec-ref"))!;
    fireEvent.mouseEnter(ref.parentElement!);
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toContain("Three private answer choices");
    expect(tip.textContent).toContain("Each card is answered yes, curious or pass.");
    expect(tip.textContent).not.toContain("The answer stays private.");
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("use-case: Choose a side and answer the cards");
  });
});

describe("the use-case diagram in UML", () => {
  it("draws the evening apart extending the deal, in both renderers, goals first (EX-01m4gg8xn5gczyzcygyctfw3j1)", () => {
    const spec = boardSpec(told());
    const graph = useCaseGraph(spec);
    expect(graph.edges).toContainEqual(expect.objectContaining({ from: IDS.playApart, to: IDS.deal, label: "«extend»", open: true, dashed: true }));
    expect(graph.nodes.findIndex((entry) => entry.shape === "goal")).toBeLessThan(graph.nodes.findIndex((entry) => entry.shape === "use-case"));
    const { source, nodes } = useCaseDiagram(spec);
    const short = (id: string) => [...nodes].find(([, target]) => target === id)![0];
    expect(source).toContain(`${short(IDS.playApart)} -.->|"«extend»"| ${short(IDS.deal)}`);
    expect(source.indexOf('subgraph goals')).toBeLessThan(source.indexOf('subgraph system'));
  });

  it("puts the Player and the Visitor outside the boundary that holds the use cases (EX-01m4gh4s9gyew9m3trn627jrac)", () => {
    const graph = useCaseGraph(boardSpec(told()));
    const actors = graph.nodes.filter((entry) => entry.shape === "actor");
    expect(actors.map((entry) => entry.label)).toEqual(["Player", "Visitor"]);
    expect(actors.every((entry) => !entry.group)).toBe(true);
    expect(graph.nodes.filter((entry) => entry.shape === "use-case").every((entry) => entry.group === "system")).toBe(true);
    expect(graph.edges.filter((edge) => actors.some((actor) => actor.id === edge.to)).every((edge) => edge.plain)).toBe(true);
    expect(graph.edges.filter((edge) => edge.from.startsWith("G-")).every((edge) => edge.dotted)).toBe(true);
  });
});

const change = (name: string, over: Partial<OpenChange> = {}): OpenChange => ({
  name, title: `The ${name} change`, proposal: "Why.", nodes: [], removed: [], openDecisions: [], planned: true, approved: false, uncommitted: [], ...over,
});
function serve(data: Workspace) {
  vi.stubGlobal("fetch", () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response));
}

describe("where the board opens", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens on the one open change when nothing is accepted (EX-01m4gg8xtv2dgnnazgrfag2j59)", async () => {
    serve(workspace({ spec: [], changes: [change("baseline", { nodes: boardSpec(flat()).slice(0, 3).map((entry) => ({ ...entry, mark: "added" as const })) })] }));
    render(<App />);
    expect(await screen.findByRole("region", { name: "Open change: The baseline change" })).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("change")).toBe("baseline");
  });

  it("opens on the list when several changes are open and nothing is accepted (EX-01m4ggqcvsax811dfpeqm4emh4)", async () => {
    serve(workspace({ spec: [], changes: [change("one"), change("two")] }));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Open changes" })).toBeTruthy();
    const list = document.querySelector(".change-list")!;
    expect(within(list as HTMLElement).getByRole("button", { name: /The one change/ })).toBeTruthy();
    expect(within(list as HTMLElement).getByRole("button", { name: /The two change/ })).toBeTruthy();
  });

  it("restores the same view, search and node from a copied address (EX-01m4ghr8w38wt1tweg4bb2r1te)", async () => {
    const spec = boardSpec(told());
    serve(workspace({ spec }));
    window.history.replaceState(null, "", `/${writeAddress("", { view: "spec", change: null, filter: "all", form: "all", query: "at least three cards", node: RULE, arrangement: "goal" })}`);
    render(<App />);
    expect(await screen.findByRole("dialog", { name: "business-rule: Three private answer choices" })).toBeTruthy();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("at least three cards");
    expect(readAddress(window.location.search)).toMatchObject({ view: "spec", query: "at least three cards", node: RULE });
  });
});

describe("what the human decided", () => {
  it("an accepted node names the change that landed it and what its approval covered (EX-01m4gh4s32tcgq6yj2zm5ynnr7)", () => {
    const spec = boardSpec(told()).map((entry) => ({ ...entry, provenance: { sources: [], decided_by: entry.id === IDS.deal ? "human" as const : "agent-decided" as const } }));
    const landed = readBoard(workspace({ spec, landings: [{ change: "baseline", title: "Import the OpenSpec narrative", by: "Árpád Tamási", at: "2026-10-09T13:50:47.138Z", agentDecidedAtGate: ["Sign in (UC-82632knv) — derived"], nodes: spec.map((entry) => entry.id) }] }));
    render(<EntityDrawer id={IDS.signIn} board={landed} onClose={() => {}} onOpen={() => {}} />);
    const note = document.querySelector(".approval-note")!.textContent ?? "";
    expect(note).toContain("Landed with the change Import the OpenSpec narrative, approved by Árpád Tamási on 2026-10-09.");
    expect(note).toContain("The agent decided this node alone; it was approved with the change as a whole, not reviewed one by one.");
  });

  it("an approved change says who said yes, that it covers the whole delta, and the counts as provenance records them", () => {
    const nodes = boardSpec(flat()).slice(0, 4).map((entry, index) => ({ ...entry, mark: "added" as const, provenance: { sources: [], decided_by: index === 0 ? "human" as const : "agent-decided" as const } }));
    render(<ChangeHeader change={change("baseline", { approved: true, nodes, approval: { by: "Árpád Tamási", at: "2026-10-09T13:50:47Z", agentDecidedAtGate: ["Three lines", "as the gate", "listed them"] } })} onOpen={() => {}} />);
    const summary = document.querySelector(".approval-summary")!.textContent ?? "";
    expect(summary).toContain("Approved by Árpád Tamási on 2026-10-09. The yes covers the whole change as planned.");
    expect(summary).toContain("1 were decided by you, 0 the agent proposed and you approved, and 3 the agent decided alone");
    expect(screen.getByText(/What the gate listed as the agent's own decisions · 3/)).toBeTruthy();
  });

  it("a change nobody approved says so", () => {
    render(<ChangeHeader change={change("draft")} onOpen={() => {}} />);
    expect(document.querySelector(".approval-summary")!.textContent).toBe("Nobody has said yes to this change yet.");
  });
});

describe("the board's quality", () => {
  it("a phrase from a rule body is found (EX-01m4ghr8w38wt1tweg4bb2r1te)", () => {
    const spec = boardSpec(told()).map((entry) => entry.id === RULE ? { ...entry, sections: { rule: "A deal has at least three cards per side." } } : entry);
    render(<SpecView board={readBoard(workspace({ spec }))} filter="all" form="all" query="at least three cards" onFilter={() => {}} onForm={() => {}} onQuery={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("Three private answer choices")).toBeTruthy();
    expect(screen.queryByText("Both answer Yes")).toBeNull();
  });

  it("no raw label, counts that match, a tab named for the project, and a drop that says it is a simulation (EX-01m4ghr91fmchrjjrvy1sps150)", async () => {
    const spec = boardSpec(told()).map((entry) => ({ ...entry, provenance: { sources: [], level: "partly-inferred" as const, decided_by: "agent-decided" as const } }));
    serve(workspace({ project: "intimity", spec }));
    const { container } = render(<App />);
    await screen.findByText("Three private answer choices");
    expect(document.title).toBe("Kotta — intimity");
    const text = container.textContent ?? "";
    for (const raw of ["PARTLY INFERRED", "NO ADMISSION", "USER-GOAL", "partly-inferred", "agent-decided", "user-goal"]) expect(text).not.toContain(raw);
    for (const item of container.querySelectorAll(".rail__item")) {
      const count = item.querySelector(".rail__count");
      if (!count) continue;
      const label = item.querySelector(".rail__label")!.textContent;
      const expected = { Specification: spec.length, Hierarchy: spec.filter((entry) => ["goal", "use-case"].includes(entry.form)).length, "Use cases": spec.filter((entry) => ["use-case", "actor", "goal"].includes(entry.form)).length }[label ?? ""];
      if (expected !== undefined) expect(Number(count.textContent)).toBe(expected);
    }
    vi.unstubAllGlobals();
  });

  it("every row's shared mark is said once, in the group head (EX-01m4ghr8pn9bjgmcm557zf5xdt)", () => {
    const spec = boardSpec(told()).map((entry) => ({ ...entry, mark: "added" as const, provenance: { sources: [], level: "partly-inferred" as const } }));
    const { container } = render(<SpecView board={readBoard(workspace({ spec }))} filter="all" form="all" query="" onFilter={() => {}} onForm={() => {}} onQuery={() => {}} onOpen={() => {}} />);
    for (const group of container.querySelectorAll(".spec-group")) {
      if (group.querySelectorAll(".spec-row").length < 2) continue;
      expect(group.querySelector(".spec-group__shared")!.textContent).toContain("added · partly filled in");
      for (const row of group.querySelectorAll(".spec-row")) expect(row.textContent).not.toContain("partly filled in");
    }
  });
});
