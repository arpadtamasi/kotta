// @vitest-environment jsdom
//
// The specification as a destination of its own. The first wave made it legible where a task is
// read and left it with no way in: 141 nodes reachable only through a task that happened to name
// them, and a rail calling the flow "observations, tasks, batches" when the chain the product runs
// is observations → specification → tasks (IF-01m0f0wn898ggsdxa0kh6t6tnw,
// BR-01m0pw5bc7b1rkg5dct5qgdkmb). The admissions are the other half: three kinds that ask for
// opposite work, counted apart or not at all (BR-01m0swjgrreeby1pyfdzf4mf7d).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, Rail, SpecView, admissionKind, readBoard } from "../../ui/src/App";
import { task, workspace } from "./fixtures";

afterEach(cleanup);

const ACTOR = "A-01m0f0wn89ewnpex9n4tq0s0rg";
const GOAL = "G-01m0f0wn89bsqrswjac57sdzez";
const GAP = "UC-01m0fpqfxjvet99wbz0v1ag64q";
const REMEDY = "EX-01m0p6c7a46000000000000ex";
const NAMING = "BR-01m0f0wn89c50fe1mz5yn1nw85";

const node = (id: string, form: string, title: string, over: Record<string, unknown> = {}) => ({
  id, form, title, path: `.kotta/spec/${form}s/${id.slice(-8)}.md`, accepted: [], edges: {},
  sections: { intent: "What this node promises." }, ...over,
});

const executing = task("T-01m120js1qey632tbv5can43ed", "A landing that only re-kinds admissions is not a delta", {
  status: "done", sections: { outcome: "Delta." }, spec: [GAP],
});

const populated = workspace({
  tasks: [executing],
  spec: [
    node(ACTOR, "actor", "Operator", { accepted: ["structural: assigned from the form, not from examining it."] }),
    node(GOAL, "goal", "Work is accounted for"),
    node(GAP, "use-case", "Analyze the implementation gap", {
      accepted: ["unexamined: nobody has checked whether this promise is kept."],
      edges: { actor: [ACTOR], goal: [GOAL] },
    }),
    node(REMEDY, "example", "A remedy that adds a capability amends the specification", {
      accepted: ["unimplemented: the work this names is not done."],
    }),
    node(NAMING, "business-rule", "Identifiers are permanent"),
  ],
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
  it("reaches every node without a task that names it, grouped by the form that declares it", () => {
    const { container } = renderView();
    const groups = [...container.querySelectorAll(".spec-group__head")].map((head) => head.textContent);

    // Every form present is a group, and the node no task names is in it just the same.
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

  it("says whether anything executes a node, and finds one by title", () => {
    renderView();
    expect(screen.getByText("1 task executes it")).toBeTruthy();
    expect(screen.getAllByText("no task names it").length).toBe(4);

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
    // An admission that names no kind is not filed under a guess (BR-01m0swjgrreeby1pyfdzf4mf7d).
    expect(admissionKind({ accepted: ["nobody has looked at this yet."] })).toBeNull();
  });
});

describe("the derivation chain the rail names", () => {
  it("puts the specification between what was noticed and what is executed", () => {
    render(<Rail view="home" board={board()} running={false} onView={() => {}} onWatch={() => {}} onReport={() => {}} />);
    const chain = screen.getAllByRole("button").map((item) => item.textContent ?? "");
    const step = (label: string) => chain.findIndex((text) => text.includes(label));

    expect(step("Observations")).toBeLessThan(step("Specification"));
    expect(step("Specification")).toBeLessThan(step("Tasks"));
    expect(step("Tasks")).toBeLessThan(step("Batches"));
  });
});

describe("a node's place in the graph", () => {
  it("shows the edges it answers, the nodes that answer it, and the tasks that execute it", () => {
    render(<EntityDrawer id={GAP} workspace={populated} board={board()} onClose={() => {}} onOpen={() => {}} />);

    // Outgoing: what this node answers, under the field name its own form gave the edge.
    const answers = screen.getByText("Answers").closest("section")!;
    expect(within(answers).getByText("actor")).toBeTruthy();
    expect(within(answers).getByText("Operator")).toBeTruthy();
    expect(within(answers).getByText("Work is accounted for")).toBeTruthy();

    // Incoming: read from the other side, never from a reciprocal field this node would carry.
    cleanup();
    render(<EntityDrawer id={ACTOR} workspace={populated} board={board()} onClose={() => {}} onOpen={() => {}} />);
    const answered = screen.getByText("Answered by").closest("section")!;
    expect(within(answered).getByText("Analyze the implementation gap")).toBeTruthy();
    expect(within(answered).getByText("actor")).toBeTruthy();
  });

  it("opens the node an edge names", () => {
    const onOpen = vi.fn();
    render(<EntityDrawer id={GAP} workspace={populated} board={board()} onClose={() => {}} onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Operator"));
    expect(onOpen).toHaveBeenCalledWith(ACTOR);
  });
});
