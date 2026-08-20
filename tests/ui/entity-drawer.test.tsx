// @vitest-environment jsdom
//
// Opening an entity draws its derivation: what it came from, what it goes with, and — when
// a recorded link has nothing behind it — the dangling reference itself. Escape closes the
// drawer and hands focus back to the row that opened it.
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, readBoard, type Workspace } from "../../ui/src/App";
import { decision, observation, batch, task, workspace } from "./fixtures";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const populated = workspace({
  tasks: [
    task("T-012", "Make the UI workspace argument explicit", {
      status: "active", batch: "P-003", source_observation: "F-001", assigned_agent: "codex", branch: "kotta/t-012",
      claim: { task: "T-012", agent: "codex", branch: "kotta/t-012", worktree: ".worktrees/T-012", started_at: "2026-08-14T08:00:00Z" },
      sections: { user_goal: "Know which workspace is being read.", outcome: "The argument is explicit.", acceptance: "The path is visible.", constraints: "The board stays read-only.", verification: "Run the component test.", scope: "The board and UI server." },
    }),
    task("T-013", "Add a discoverable bug-reporting path", { status: "review", batch: "P-003" }),
    task("T-014", "Port collision returns raw EADDRINUSE", { status: "defined", source_observation: "F-404" }),
    task("T-019", "Sweep unfinished work", { status: "backlog" }),
  ],
  batches: [batch("P-003", "Trustworthy daily use", { status: "active", tasks: ["T-012", "T-013"], sections: { goal: "One module: truthful execution state." } })],
  observations: [observation("F-001", "CLI help contradicts the --workspace default", { status: "resolved", became: "T-012", discovered_during: "T-019" })],
  decisions: [decision("D-001", "The directory is the state")],
  events: [
    { id: "E-01kzzzzzzzzzzzzzzzzzzzzzzz", entity: "T-012", task: "T-012", kind: "lifecycle", created_at: "2026-08-14T07:00:00Z", state: "execution-implemented", summary: "Executor completed.", payload: { started_at: "2026-08-14T06:47:30Z", completed_at: "2026-08-14T07:00:00Z", duration_ms: 750_000, token_usage: { input_tokens: 1000, output_tokens: 250, total_tokens: 1250 } } },
    { id: "E-01kzzzzzzzzzzzzzzzzzzzzzzy", entity: "T-012", task: "T-012", kind: "message", created_at: "2026-08-14T07:05:00Z", role: "human", text: "Keep the activity secondary." },
  ],
});

/** A row that opens the drawer, so focus can be observed leaving and coming back. */
function Harness({ id, data = populated }: { id: string; data?: Workspace }) {
  const [open, setOpen] = useState(false);
  const board = readBoard(data);
  return <>
    <button type="button" onClick={() => setOpen(true)}>row</button>
    {open && <EntityDrawer id={id} workspace={data} board={board} onClose={() => setOpen(false)} onOpen={() => {}} />}
  </>;
}
function openDrawer(id: string, data: Workspace = populated) {
  render(<Harness id={id} data={data} />);
  const row = screen.getByRole("button", { name: "row" });
  row.focus();
  fireEvent.click(row);
  return row;
}
function openContext() {
  fireEvent.click(screen.getByRole("tab", { name: "Context" }));
}

describe("Entity drawer — derivation", () => {
  it("names the task by its title and draws came from and goes with", () => {
    openDrawer("T-012");
    openContext();
    const drawer = screen.getByRole("dialog", { name: "task: Make the UI workspace argument explicit" });
    expect(within(drawer).getByRole("heading", { name: "Make the UI workspace argument explicit" })).toBeDefined();
    const derivation = within(drawer).getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText("came from")).toBeDefined();
    expect(within(derivation).getByText("goes with")).toBeDefined();
    // Both links read as titles, not as ids.
    expect(within(derivation).getByText("CLI help contradicts the --workspace default")).toBeDefined();
    expect(within(derivation).getByText("Trustworthy daily use")).toBeDefined();
    // The sibling in the same batch comes with it, by title and state.
    expect(within(derivation).getByRole("button", { name: /Add a discoverable bug-reporting path/ })).toBeDefined();
  });

  it("draws a missing target as a dangling reference instead of dropping the link", () => {
    openDrawer("T-014");
    openContext();
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText("dangling reference")).toBeDefined();
    expect(within(derivation).getByText(/source_observation: F-404/)).toBeDefined();
    expect(within(derivation).getByText(/no such entity on disk/)).toBeDefined();
  });

  it("says plainly when a task has no source and no batch", () => {
    openDrawer("T-019");
    openContext();
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText(/written straight as a task/)).toBeDefined();
    expect(within(derivation).getByText("Not in a batch — nothing else has to be solved together with it.")).toBeDefined();
  });

  it("derives an observation from where it was seen to what it became", () => {
    openDrawer("F-001");
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText("Sweep unfinished work")).toBeDefined();
    expect(within(derivation).getByText("Make the UI workspace argument explicit")).toBeDefined();
  });

  it("shows the specification nodes an amend-spec observation touched, instead of a task", () => {
    const data = workspace({ observations: [observation("F-050", "The lifecycle glossary is silent on amend-spec", {
      status: "resolved", disposition: "amend-spec", spec: ["SM-01m0f0wn892ntx934by9gwednb", "GT-01m0f0wn89ep8038fwn1nf1kkc"],
    })] });
    openDrawer("F-050", data);
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText(/Amended the specification/)).toBeDefined();
    expect(within(derivation).getByText("SM-01m0f0wn892ntx934by9gwednb")).toBeDefined();
    expect(within(derivation).getByText("GT-01m0f0wn89ep8038fwn1nf1kkc")).toBeDefined();
    expect(within(derivation).queryByText(/No task was written/)).toBeNull();
  });

  it("lists the members of a batch as its goes-with", () => {
    openDrawer("P-003");
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText(/A batch is written, not derived/)).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Make the UI workspace argument explicit/ })).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Add a discoverable bug-reporting path/ })).toBeDefined();
  });

  it("opens a decision by its title too", () => {
    openDrawer("D-001");
    expect(screen.getByRole("dialog", { name: "decision: The directory is the state" })).toBeDefined();
  });
});

describe("Entity drawer — focused task information", () => {
  it("opens on a structured brief and keeps chat last", () => {
    openDrawer("T-012");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Brief", "Context", "Activity"]);
    expect(screen.getByRole("tab", { name: "Brief" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: "Goal" })).toBeDefined();
    expect(screen.getByText("Know which workspace is being read.")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Expected output" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Success conditions" })).toBeDefined();
    expect(screen.queryByText("Keep the activity secondary.")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("Keep the activity secondary.")).toBeDefined();
  });

  it("labels historic missing execution metrics instead of treating them as zero", () => {
    openDrawer("T-019");
    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.queryByText("0 tokens")).toBeNull();
  });

  it("shows current elapsed time and the last recorded duration and tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T09:30:00Z"));
    openDrawer("T-012");
    expect(screen.getByText("Running 1h 30m")).toBeDefined();
    expect(screen.getByText("12m 30s")).toBeDefined();
    expect(screen.getByText("1,250 tokens")).toBeDefined();
  });

  it("moves between tabs with arrow keys", () => {
    openDrawer("T-012");
    const brief = screen.getByRole("tab", { name: "Brief" });
    brief.focus();
    fireEvent.keyDown(brief, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Context" }));
    expect(screen.getByRole("region", { name: "Derivation" })).toBeDefined();
  });
});

describe("Entity drawer — open and close", () => {
  it("moves focus into the drawer on open", () => {
    openDrawer("T-012");
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("closes on Escape and returns focus to the row that opened it", () => {
    const row = openDrawer("T-012");
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(row);
  });

  it("closes on the labelled control the design names", () => {
    const row = openDrawer("T-012");
    fireEvent.click(screen.getByRole("button", { name: "Close · esc" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(row);
  });

  it("issues no request of any kind while open", () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    openDrawer("T-012");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(fetcher).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

// Nesting is grouping (D-01kztxvppd40r77cq7kw9b8wzr): a parent that names only child batches has
// work in it, and the board has to show both the children and the tasks underneath them.
describe("Entity drawer — a batch that groups other batches", () => {
  const nested = workspace({
    tasks: [
      task("T-100", "Build parser", { status: "done", batch: "P-010" }),
      task("T-101", "Expose command", { status: "active", batch: "P-011" }),
    ],
    batches: [
      batch("P-010", "Core", { tasks: ["T-100"] }),
      batch("P-011", "Surface", { tasks: ["T-101"] }),
      batch("P-012", "Product", { batches: ["P-010", "P-011"] }),
    ],
  });

  it("draws its children and the tasks underneath them, not an empty batch", () => {
    openDrawer("P-012", nested);
    const dependencyTree = screen.getByRole("region", { name: "Dependency tree" });
    expect(within(dependencyTree).getByLabelText("Nested batches in Product")).toBeDefined();
    expect(within(dependencyTree).getByLabelText("Execution waves for Product")).toBeDefined();
    expect(within(dependencyTree).getByText("Wave 1")).toBeDefined();
    const derivation = screen.getByRole("region", { name: "Derivation" });

    expect(within(derivation).getByRole("button", { name: /Core/ })).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Surface/ })).toBeDefined();
    // The work list is the subtree: a parent with no direct tasks is not empty.
    expect(within(derivation).getByRole("button", { name: /Build parser/ })).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Expose command/ })).toBeDefined();
    expect(within(derivation).queryByText("No member tasks.")).toBeNull();
  });
});
