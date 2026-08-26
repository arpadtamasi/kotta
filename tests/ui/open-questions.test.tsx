// @vitest-environment jsdom
//
// What still waits on a human in this entity, as its own panel (BR-01m0z873stwx7szg5896gwsbry,
// UC-01m0f0wn89m98wpkqq8e5c9p6p). The panel shows the same enumeration the defining gate reads,
// and selecting a question carries the reader to where it is written — which for a task means
// opening the tab that holds its Open decisions section first.
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, readBoard, type Workspace } from "../../ui/src/App";
import { observation, task, workspace } from "./fixtures";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const QUESTIONS = [
  { position: 1, reference: "T-024/Q1", text: "Which store?", line: 70, decisions: ["D-001"], resolved: true },
  { position: 2, reference: "T-024/Q2", text: "Which retention window?", line: 71, decisions: [], resolved: false },
  { position: 3, reference: "T-024/Q3", text: "Who pays for the egress?", line: 72, decisions: [], resolved: false },
];

const asking = workspace({
  tasks: [
    task("T-024", "Entity open questions", {
      status: "backlog",
      questions: QUESTIONS,
      sections: { outcome: "Questions are listable.", "open decisions": "- Which store? Settled by D-001.\n- Which retention window?\n- Who pays for the egress?" },
    }),
    task("T-019", "Sweep unfinished work", { status: "done", sections: { outcome: "Nothing waits." } }),
  ],
  observations: [
    observation("F-042", "The exporter drops rows", {
      questions: [{ position: 1, reference: "F-042/Q1", text: "Is dropping rows ever correct?", line: 20, decisions: [], resolved: false }],
      sections: { evidence: "Row 42 is absent.", "open decisions": "- Is dropping rows ever correct?" },
    }),
  ],
});

function Harness({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const board = readBoard(asking);
  return <>
    <button type="button" onClick={() => setOpen(true)}>row</button>
    {open && <EntityDrawer id={id} workspace={asking} board={board} onClose={() => setOpen(false)} onOpen={() => {}} />}
  </>;
}

function openDrawer(id: string) {
  render(<Harness id={id} />);
  fireEvent.click(screen.getByRole("button", { name: "row" }));
}

describe("the open-questions panel", () => {
  it("lists every question the entity asks, answered ones included, and counts what is waiting", () => {
    openDrawer("T-024");
    const panel = screen.getByRole("region", { name: "Open questions" });
    expect(within(panel).getByText(/2 of 3 waiting/)).toBeTruthy();
    expect(within(panel).getByText("Which store?")).toBeTruthy();
    expect(within(panel).getByText("Which retention window?")).toBeTruthy();
    // The answered question says what answered it rather than disappearing.
    expect(within(panel).getByText("answered by D-001")).toBeTruthy();
    expect(within(panel).getAllByText("waiting on you")).toHaveLength(2);
  });

  it("selecting a question opens the tab its section lives in and scrolls to the item", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) { scrolled.push(this); };
    openDrawer("T-024");
    // Open decisions lives behind the Context tab, which is not the tab the drawer opens on.
    expect(screen.getByRole("tab", { name: "Brief" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /Which retention window/ }));
    expect(screen.getByRole("tab", { name: "Context" }).getAttribute("aria-selected")).toBe("true");
    vi.advanceTimersByTime(1);

    expect(scrolled).toHaveLength(1);
    // The second question, not the section: the reader lands on the line they clicked.
    expect(scrolled[0].textContent).toContain("Which retention window?");
    expect(scrolled[0].textContent).not.toContain("Which store?");
  });

  it("an entity with no open questions shows no panel", () => {
    openDrawer("T-019");
    expect(screen.queryByRole("region", { name: "Open questions" })).toBeNull();
  });

  it("a kind without tabs gets the same panel, and scrolls within the drawer", () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) { scrolled.push(this); };
    openDrawer("F-042");
    const panel = screen.getByRole("region", { name: "Open questions" });
    expect(within(panel).getByText("Is dropping rows ever correct?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Is dropping rows ever correct/ }));
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0].textContent).toContain("Is dropping rows ever correct?");
  });
});
