// @vitest-environment jsdom
//
// Opening an entity draws its derivation: what it came from, what it goes with, and — when
// a recorded link has nothing behind it — the dangling reference itself. Escape closes the
// drawer and hands focus back to the row that opened it.
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, readBoard, type Workspace } from "../../ui/src/App";
import { decision, observation, batch, contract, workspace } from "./fixtures";

afterEach(cleanup);

const populated = workspace({
  contracts: [
    contract("T-012", "Make the UI workspace argument explicit", { status: "active", batch: "P-003", source_observation: "F-001", assigned_agent: "codex", branch: "kotta/t-012", sections: { outcome: "The argument is explicit." } }),
    contract("T-013", "Add a discoverable bug-reporting path", { status: "review", batch: "P-003" }),
    contract("T-014", "Port collision returns raw EADDRINUSE", { status: "defined", source_observation: "F-404" }),
    contract("T-019", "Sweep unfinished work", { status: "backlog" }),
  ],
  batches: [batch("P-003", "Trustworthy daily use", { status: "active", contracts: ["T-012", "T-013"], sections: { goal: "One module: truthful execution state." } })],
  observations: [observation("F-001", "CLI help contradicts the --workspace default", { status: "resolved", became: "T-012", discovered_during: "T-019" })],
  decisions: [decision("D-001", "The directory is the state")],
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

describe("Entity drawer — derivation", () => {
  it("names the contract by its title and draws came from and goes with", () => {
    openDrawer("T-012");
    const drawer = screen.getByRole("dialog", { name: "contract: Make the UI workspace argument explicit" });
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
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText("dangling reference")).toBeDefined();
    expect(within(derivation).getByText(/source_observation: F-404/)).toBeDefined();
    expect(within(derivation).getByText(/no such entity on disk/)).toBeDefined();
  });

  it("says plainly when a contract has no source and no batch", () => {
    openDrawer("T-019");
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText(/written straight as a contract/)).toBeDefined();
    expect(within(derivation).getByText("Not in a batch — nothing else has to be solved together with it.")).toBeDefined();
  });

  it("derives an observation from where it was seen to what it became", () => {
    openDrawer("F-001");
    const derivation = screen.getByRole("region", { name: "Derivation" });
    expect(within(derivation).getByText("Sweep unfinished work")).toBeDefined();
    expect(within(derivation).getByText("Make the UI workspace argument explicit")).toBeDefined();
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
// work in it, and the board has to show both the children and the contracts underneath them.
describe("Entity drawer — a batch that groups other batches", () => {
  const nested = workspace({
    contracts: [
      contract("T-100", "Build parser", { status: "done", batch: "P-010" }),
      contract("T-101", "Expose command", { status: "active", batch: "P-011" }),
    ],
    batches: [
      batch("P-010", "Core", { contracts: ["T-100"] }),
      batch("P-011", "Surface", { contracts: ["T-101"] }),
      batch("P-012", "Product", { batches: ["P-010", "P-011"] }),
    ],
  });

  it("draws its children and the contracts underneath them, not an empty batch", () => {
    openDrawer("P-012", nested);
    const derivation = screen.getByRole("region", { name: "Derivation" });

    expect(within(derivation).getByRole("button", { name: /Core/ })).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Surface/ })).toBeDefined();
    // The work list is the subtree: a parent with no direct contracts is not empty.
    expect(within(derivation).getByRole("button", { name: /Build parser/ })).toBeDefined();
    expect(within(derivation).getByRole("button", { name: /Expose command/ })).toBeDefined();
    expect(within(derivation).queryByText("No member contracts.")).toBeNull();
  });
});
