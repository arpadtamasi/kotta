// @vitest-environment jsdom
//
// The board projects the specification, not only its execution (IF-01m0f0wn898ggsdxa0kh6t6tnw).
// The operator opened it and said the spec was not there at all: src/commands/ui.ts held no
// occurrence of "spec", 141 nodes across 11 forms were absent, and the one place the word appeared
// printed bare ids with nothing to open. These pin the half that makes the rest legible — what a
// task executes, and the gate that let it become defined.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, readBoard } from "../../ui/src/App";
import { observation, task, workspace } from "./fixtures";

afterEach(cleanup);

const GAP = "UC-01m0fpqfxjvet99wbz0v1ag64q";
const NAMING = "BR-01m0f0wn89c50fe1mz5yn1nw85";

const specNode = (id: string, form: string, title: string, over: Record<string, unknown> = {}) => ({
  id, form, title, path: `.kotta/spec/${form}s/${title.toLowerCase().replaceAll(" ", "-")}.md`,
  accepted: [], sections: { intent: "What this node promises." }, ...over,
});

const covered = task("T-01m120js1qey632tbv5can43ed", "A landing that only re-kinds admissions is not a delta", {
  status: "done",
  sections: { outcome: "The delta section said too much.", acceptance: "- The delta is an agreement, not bookkeeping." },
  spec: [GAP],
  coverage: { "The delta is an agreement, not bookkeeping.": [GAP] },
});

const populated = workspace({
  tasks: [covered],
  observations: [observation("F-01m0t75ff4eg3nm0gtwg7qqm4b", "The delta listed the whole specification", {
    status: "resolved", disposition: "amend-spec", spec: [GAP],
  })],
  spec: [
    specNode(GAP, "use-case", "Analyze the implementation gap", {
      accepted: ["structural: assigned from the form of this node, not from examining it."],
      sections: { intent: "Answer which promises have no evidence.", alternatives: "A deliberate gap is listed with its reason." },
    }),
    specNode(NAMING, "business-rule", "Identifiers are permanent"),
  ],
  specForms: [{ id: "use-case", directory: "use-cases", title: "A goal-directed interaction." }],
});

const open = (id: string, onOpen = () => {}) => {
  const board = readBoard(populated);
  return render(<EntityDrawer id={id} workspace={populated} board={board} onClose={() => {}} onOpen={onOpen} />);
};

describe("the specification on the board", () => {
  it("is read at all: every node of every registered form reaches the board", () => {
    const board = readBoard(populated);
    expect(board.spec.map((node) => node.id)).toEqual([GAP, NAMING]);
    expect(board.specById.get(GAP)?.form).toBe("use-case");
  });

  it("a task names what it executes and maps each condition to what carries it", () => {
    const { container } = open(covered.id);
    const panel = container.querySelector(".spec-panel")!;
    expect(panel).toBeTruthy();

    expect(within(panel as HTMLElement).getByText("Specification it executes")).toBeTruthy();
    expect(within(panel as HTMLElement).getByText("Each condition, and what carries it")).toBeTruthy();
    // The condition appears twice on purpose: once as the task's own acceptance, once in the map
    // that says what carries it. The map is the half that was missing.
    expect(panel.querySelector(".spec-panel__condition")?.textContent).toBe("The delta is an agreement, not bookkeeping.");
    // Named by its title, never by the id alone (BR-01m0f0wn89c50fe1mz5yn1nw85).
    expect(within(panel as HTMLElement).getAllByText("Analyze the implementation gap").length).toBe(2);
  });

  it("a reference opens the node it names, from the task and from an amend-spec observation alike", () => {
    const fromTask = vi.fn();
    open(covered.id, fromTask);
    fireEvent.click(screen.getAllByText("Analyze the implementation gap")[0]);
    expect(fromTask).toHaveBeenCalledWith(GAP);
    cleanup();

    const fromObservation = vi.fn();
    open("F-01m0t75ff4eg3nm0gtwg7qqm4b", fromObservation);
    fireEvent.click(screen.getByText("Analyze the implementation gap"));
    expect(fromObservation).toHaveBeenCalledWith(GAP);
  });

  it("an opened node shows what it promises, how it is admitted, and what leans on it", () => {
    open(GAP);

    // Twice: the drawer names the kind, and the fields name the form the node declares.
    expect(screen.getAllByText("use-case").length).toBe(2);
    expect(screen.getByText(/Answer which promises have no evidence/)).toBeTruthy();
    expect(screen.getByText(/structural: assigned from the form/)).toBeTruthy();
    expect(screen.getByText(".kotta/spec/use-cases/analyze-the-implementation-gap.md")).toBeTruthy();
    // The direction the specification itself may never point: the tasks that execute it.
    expect(screen.getByText("Executed by")).toBeTruthy();
    expect(screen.getByText(covered.title)).toBeTruthy();
  });

  it("a task with no coverage says so rather than showing an empty panel", () => {
    const bare = task("T-01m120jsvqwswpkdvhdz0jhh5j", "An older task", { spec: [], coverage: {}, sections: { outcome: "Older." } });
    const older = workspace({ tasks: [bare], spec: populated.spec, specForms: populated.specForms });
    render(<EntityDrawer id={bare.id} workspace={older} board={readBoard(older)} onClose={() => {}} onOpen={() => {}} />);

    expect(screen.queryByText("Specification it executes")).toBeNull();
  });
});
