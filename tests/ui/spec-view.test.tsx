// @vitest-environment jsdom
//
// The specification is the board's one destination in 1.0: every node of every form, grouped by
// the form that declares it, with its admission and its place in the graph. The admissions are
// three kinds that ask for opposite work, counted apart or not at all.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, SpecView, TopBar, admissionKind, readBoard } from "../../ui/src/App";
import { node, workspace } from "./fixtures";

afterEach(cleanup);

const ACTOR = "A-01m0f0wn89ewnpex9n4tq0s0rg";
const GOAL = "G-01m0f0wn89bsqrswjac57sdzez";
const GAP = "UC-01m0fpqfxjvet99wbz0v1ag64q";
const REMEDY = "EX-01m0p6c7a46000000000000ex";
const NAMING = "BR-01m0f0wn89c50fe1mz5yn1nw85";

const populated = workspace({
  spec: [
    node(ACTOR, "actor", "Operator", { accepted: ["structural: assigned from the form, not from examining it."] }),
    node(GOAL, "goal", "Work is accounted for"),
    node(GAP, "use-case", "Analyze the implementation gap", {
      accepted: ["unexamined: nobody has checked whether this promise is kept."],
      edges: { actor: [ACTOR], goal: [GOAL] },
      sections: { intent: `Answer which promises have no evidence, for ${ACTOR}.`, alternatives: "A deliberate gap is listed with its reason." },
    }),
    node(REMEDY, "example", "A remedy that adds a capability amends the specification", {
      accepted: ["unimplemented: the work this names is not done."],
    }),
    node(NAMING, "business-rule", "Identifiers are permanent"),
  ],
  specForms: [{ id: "use-case", directory: "use-cases", title: "A goal-directed interaction." }],
});

const board = () => readBoard(populated);

function renderView(over: Partial<Parameters<typeof SpecView>[0]> = {}) {
  return render(<SpecView
    board={over.board ?? board()}
    filter={over.filter ?? "all"} form={over.form ?? "all"} query={over.query ?? ""}
    onFilter={over.onFilter ?? (() => {})} onForm={over.onForm ?? (() => {})}
    onQuery={over.onQuery ?? (() => {})} onOpen={over.onOpen ?? (() => {})}
  />);
}

describe("the specification view", () => {
  it("reaches every node, grouped by the form that declares it", () => {
    const { container } = renderView();
    const groups = [...container.querySelectorAll(".spec-group__head")].map((head) => head.textContent);

    expect(groups.some((head) => head?.startsWith("business-rule"))).toBe(true);
    expect(screen.getByText("Identifiers are permanent")).toBeTruthy();
    expect(screen.getByText("A remedy that adds a capability amends the specification")).toBeTruthy();
    expect(container.querySelectorAll(".spec-row").length).toBe(populated.spec!.length);
  });

  it("counts the three admission kinds apart, and filters to each", () => {
    const { container } = renderView();
    const chips = [...container.querySelectorAll(".filters .filter")].map((chip) => chip.textContent);
    expect(chips).toEqual(expect.arrayContaining(["all5", "no admission2", "structural1", "unexamined1", "unimplemented1"]));

    cleanup();
    renderView({ filter: "unimplemented" });
    expect(screen.getByText("A remedy that adds a capability amends the specification")).toBeTruthy();
    expect(screen.queryByText("Analyze the implementation gap")).toBeNull();
  });

  it("says what names a node, and finds one by title", () => {
    renderView();
    expect(screen.getAllByText("1 node names it").length).toBe(2);
    expect(screen.getAllByText("nothing names it").length).toBe(3);

    cleanup();
    const { container } = renderView({ query: "identifiers" });
    expect(container.querySelectorAll(".spec-row").length).toBe(1);
    expect(screen.getByText("Identifiers are permanent")).toBeTruthy();
  });

  it("opens the node a row names", () => {
    const onOpen = vi.fn();
    renderView({ onOpen });
    fireEvent.click(screen.getByText("Identifiers are permanent"));
    expect(onOpen).toHaveBeenCalledWith(NAMING);
  });

  it("reads the kind an admission names, and nothing from one that names none", () => {
    expect(admissionKind({ accepted: ["structural: assigned from the form."] })).toBe("structural");
    expect(admissionKind({ accepted: [] })).toBeNull();
    expect(admissionKind({ accepted: ["nobody has looked at this yet."] })).toBeNull();
  });

  it("shows no process: no task, batch, claim or approval word anywhere", () => {
    const { container } = renderView();
    render(<TopBar workspace={populated} board={board()} onRefresh={() => {}} refreshed={0} />);
    const text = document.body.textContent?.toLowerCase() ?? "";
    for (const word of ["task", "batch", "claim", "approval", "observation", "decision"]) expect(text, `no "${word}" on the board`).not.toContain(word);
    expect(container.textContent).toContain("Read-only");
  });
});

describe("a node's place in the graph", () => {
  it("shows the edges it answers and the nodes that answer it", () => {
    render(<EntityDrawer id={GAP} board={board()} onClose={() => {}} onOpen={() => {}} />);

    // Outgoing: what this node answers, under the field name its own form gave the edge.
    const answers = screen.getByText("Answers").closest("section")!;
    expect(within(answers).getByText("actor")).toBeTruthy();
    expect(within(answers).getByText("Operator")).toBeTruthy();
    expect(within(answers).getByText("Work is accounted for")).toBeTruthy();
    // The admission is shown as what it is: which kind of gap, and why.
    expect(screen.getByText(/unexamined: nobody has checked/)).toBeTruthy();
    expect(screen.getByText(`.kotta/spec/use-cases/analyze-the-implementation-gap-${GAP.slice(-8)}.md`)).toBeTruthy();

    // Incoming: read from the other side, never from a reciprocal field this node would carry.
    cleanup();
    render(<EntityDrawer id={ACTOR} board={board()} onClose={() => {}} onOpen={() => {}} />);
    const answered = screen.getByText("Answered by").closest("section")!;
    expect(within(answered).getByText("Analyze the implementation gap")).toBeTruthy();
    expect(within(answered).getByText("actor")).toBeTruthy();
  });

  it("opens the node an edge names, and a node named in prose", () => {
    const onOpen = vi.fn();
    render(<EntityDrawer id={GAP} board={board()} onClose={() => {}} onOpen={onOpen} />);
    // The title appears twice on purpose: once as the edge's target, once where the prose names it.
    const [edge, prose] = screen.getAllByRole("button", { name: /Operator/ });
    expect(edge.className).toContain("spec-ref");
    fireEvent.click(edge);
    expect(onOpen).toHaveBeenCalledWith(ACTOR);
    // In prose the reference reads as its title, with the id kept for recall.
    expect(prose.className).toContain("ref-s");
    expect(prose.textContent).toContain(`A-${ACTOR.slice(-8)}`);
    fireEvent.click(prose);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("a reference to nothing is drawn as dangling, never as a node", () => {
    render(<EntityDrawer id="UC-01m0c0000000000000000000zz" board={board()} onClose={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("dangling reference")).toBeTruthy();
  });
});
