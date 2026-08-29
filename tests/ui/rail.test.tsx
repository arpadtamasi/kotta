// @vitest-environment jsdom
//
// The rail is the only thing that navigates. It carries the mark, the derivation chain
// with its numbers and subtitles, Decisions outside the chain, and Running with a count
// that reflects work actually under way.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Rail, readBoard } from "../../ui/src/App";
import { decision, observation, batch, task, workspace } from "./fixtures";

afterEach(cleanup);

const populated = workspace({
  tasks: [
    task("T-001", "Define the shaping plan schema", { status: "defined" }),
    task("T-002", "Make the UI workspace argument explicit", { status: "active", batch: "P-003", assigned_agent: "codex" }),
    task("T-003", "Add a discoverable bug-reporting path", { status: "review", batch: "P-003" }),
  ],
  batches: [batch("P-003", "Trustworthy daily use", { status: "active", tasks: ["T-002", "T-003"] })],
  observations: [observation("F-007", "Triage-assistant agent")],
  decisions: [decision("D-001", "The directory is the state"), decision("D-002", "The board never picks a story")],
});

function renderRail(over: { view?: "home" | "observations" | "tasks" | "batches" | "decisions"; onView?: () => void; onWatch?: () => void } = {}) {
  const board = readBoard(populated);
  return render(<Rail
    view={over.view ?? "home"} onView={over.onView ?? (() => {})} board={board}
    running={board.running.length > 0} onWatch={over.onWatch ?? (() => {})} refreshed={2}
  />);
}

describe("Rail", () => {
  it("is a landmark carrying the mark and the wordmark", () => {
    renderRail();
    const rail = screen.getByRole("navigation", { name: "Board sections" });
    expect(rail).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "KOTTA" })).toBeDefined();
    expect(rail.querySelector("svg.mark")).not.toBeNull();
  });

  it("draws the derivation chain with its numbers and subtitles", () => {
    renderRail();
    expect(screen.getByText("derivation chain")).toBeDefined();
    // The chain the product runs: amend-spec is the primary constructive disposition and coverage
    // against an accepted node is what makes a task defined, so the specification stands between
    // what was noticed and what is executed. This list pinned it without its middle term.
    for (const [step, label, sub] of [["01", "Observations", "new information"], ["02", "Specification", "the agreement"], ["03", "Tasks", "execution"], ["04", "Batches", "sequencing"]]) {
      const entry = screen.getByRole("button", { name: new RegExp(`${step}.*${label}.*${sub}`) });
      expect(entry).toBeDefined();
    }
    expect(screen.getByRole("button", { name: /Observations/ }).textContent).toContain("1");
    expect(screen.getByRole("button", { name: /Tasks/ }).textContent).toContain("3");
  });

  it("keeps Decisions outside the chain, under cross-cutting", () => {
    renderRail();
    const chain = screen.getByText("derivation chain");
    const cross = screen.getByText("cross-cutting");
    const decisions = screen.getByRole("button", { name: /Decisions/ });
    expect(decisions.textContent).toContain("quoted, not staged");
    expect(decisions.textContent).toContain("2");
    // The cross-cutting group opens after the chain, and Decisions belongs to it.
    expect(chain.compareDocumentPosition(cross) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cross.compareDocumentPosition(decisions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("counts what is actually running and offers the watch", () => {
    const onWatch = vi.fn();
    renderRail({ onWatch });
    const running = screen.getByRole("button", { name: /Running/ });
    expect(running.textContent).toContain("1 task under way in 1 batch");
    expect(running.textContent).toContain("Watch →");
    fireEvent.click(running);
    expect(onWatch).toHaveBeenCalled();
  });

  it("says so plainly when nothing is running", () => {
    const empty = readBoard(workspace());
    render(<Rail view="home" onView={() => {}} board={empty} running={false} onWatch={() => {}} refreshed={0} />);
    expect(screen.getByRole("button", { name: /Running/ }).textContent).toContain("Nothing is running");
  });

  it("marks the current view and reports a switch to its caller", () => {
    const onView = vi.fn();
    renderRail({ view: "tasks", onView });
    expect(screen.getByRole("button", { name: /Tasks/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: /Home/ }).getAttribute("aria-current")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Batches/ }));
    expect(onView).toHaveBeenCalledWith("batches");
  });

  it("reads placeholders instead of zeroes while the workspace is still loading", () => {
    render(<Rail view="home" onView={() => {}} board={null} running={false} onWatch={() => {}} refreshed={0} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });
});
