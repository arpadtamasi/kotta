// @vitest-environment jsdom
//
// The three chain views and Decisions. What they must get right: the design's numbering and
// wording, filters that filter, and — the rule that outranks the design's own mock — an entity
// is named by its title, with the short id only as a marker beside it (D-003, D-01kz1yqm…).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BatchesView, ContractsView, DecisionsView, ObservationsView, daysSince, readBoard } from "../../ui/src/App";
import { decision, observation, batch, contract, workspace } from "./fixtures";

afterEach(cleanup);

const data = workspace({
  contracts: [
    contract("T-01kz1xrxw4aheeqv1ca0bv0fcq", "A board átállítása a Kotta Console v2 tervre", { status: "defined", source_observation: "F-010" }),
    contract("T-012", "Make the UI workspace argument explicit", { status: "active", batch: "P-003", assigned_agent: "codex", claim: { contract: "T-012", agent: "codex", branch: "feat/T-012", worktree: ".worktrees/T-012", started_at: "2026-08-04T10:00:00Z" } }),
    contract("T-029", "Reading the board makes no per-file git call", { status: "done", batch: "P-003" }),
  ],
  batches: [batch("P-003", "Trustworthy daily use", { status: "active", contracts: ["T-012", "T-029"], sections: { goal: "One module: truthful execution state." } })],
  observations: [
    observation("F-010", "The local UI is visually overcrowded", { created_at: "2026-06-01", discovered_during: "T-012" }),
    observation("F-002", "The board hides worktree state", { status: "resolved", became: "T-029" }),
  ],
  decisions: [decision("D-003", "Entity identity is a coordination-free ULID"), decision("D-010", "Existing identifiers stay", { date: "2026-08-02", sections: { decision: "Narrows D-003." } })],
});
const board = readBoard(data);

describe("Observations", () => {
  it("keeps only the focused heading and age-oriented description", () => {
    render(<ObservationsView board={board} filter="waiting" onFilter={() => {}} onOpen={() => {}} />);
    expect(screen.getByRole("heading", { name: "Observations" })).toBeDefined();
    expect(screen.getByText("New information, ordered with its age visible.")).toBeDefined();
    expect(screen.queryByText(".kotta/observations/")).toBeNull();
  });

  it("shows the waiting queue by title, ages it, and reports a filter change", () => {
    const onFilter = vi.fn();
    render(<ObservationsView board={board} filter="waiting" onFilter={onFilter} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /The local UI is visually overcrowded/ });
    expect(row.textContent).toContain("created");
    expect(row.textContent).toContain("seen during Make the UI workspace argument explicit");
    expect(screen.queryByText("The board hides worktree state")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /dispositioned/ }));
    expect(onFilter).toHaveBeenCalledWith("dispositioned");
  });

  it("shows what a dispositioned observation became, by title", () => {
    render(<ObservationsView board={board} filter="dispositioned" onFilter={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("→ Reading the board makes no per-file git call")).toBeDefined();
  });
});

describe("Contracts", () => {
  const contracts = (filter: "all" | "defined" = "all", query = "") =>
    render(<ContractsView board={board} filter={filter} onFilter={() => {}} query={query} onQuery={() => {}} onOpen={() => {}} />);

  it("keeps state filters while foregrounding age and execution", () => {
    contracts();
    expect(screen.getByText("State, age and execution at scan speed.")).toBeDefined();
    const states = ["all", "backlog", "defined", "active", "review", "done"];
    for (const state of states) expect(screen.getByRole("button", { name: new RegExp(`^${state}`) })).toBeDefined();
  });

  it("names a contract by its title and shows age plus current execution", () => {
    contracts();
    const row = screen.getByRole("button", { name: /Make the UI workspace argument explicit/ });
    expect(row.textContent).toContain("created");
    expect(row.textContent).toContain("running");
  });

  it("shows a minted id as its short tail only — never the whole ULID", () => {
    contracts();
    const minted = screen.getByRole("button", { name: /A board átállítása a Kotta Console v2 tervre/ });
    expect(minted.textContent).toContain("T-a0bv0fcq");
    expect(minted.textContent).not.toContain("T-01kz1xrxw4aheeqv1ca0bv0fcq");
    // The full id stays reachable, in the row's title attribute, behind the human label.
    expect(minted.getAttribute("title")).toBe("A board átállítása a Kotta Console v2 tervre · T-01kz1xrxw4aheeqv1ca0bv0fcq");
  });

  it("filters by state and by search", () => {
    cleanup();
    contracts("defined");
    expect(screen.getByText("A board átállítása a Kotta Console v2 tervre")).toBeDefined();
    expect(screen.queryByText("Reading the board makes no per-file git call")).toBeNull();
    cleanup();
    contracts("all", "per-file");
    expect(screen.getByText("Reading the board makes no per-file git call")).toBeDefined();
    expect(screen.queryByText("Make the UI workspace argument explicit")).toBeNull();
  });

  it("marks malformed future age as unavailable instead of negative", () => {
    const future = readBoard(workspace({ contracts: [contract("T-099", "Future timestamp", { created_at: "2999-01-01", updated_at: "2999-01-02" })] }));
    render(<ContractsView board={future} filter="all" onFilter={() => {}} query="" onQuery={() => {}} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /Future timestamp/ });
    expect(row.textContent).toContain("Unavailable");
    expect(daysSince("2999-01-01", Date.parse("2026-08-14"))).toBeNull();
  });
});

describe("Batches", () => {
  it("shows progress, goal and age without explanatory chrome", () => {
    render(<BatchesView board={board} onOpen={() => {}} />);
    expect(screen.getByText("Related work, progress and age.")).toBeDefined();
    const card = screen.getByRole("button", { name: /Trustworthy daily use/ });
    expect(card.textContent).toContain("1/2");
    expect(card.textContent).toContain("One module: truthful execution state.");
    expect(card.textContent).toContain("created");
  });
});

describe("Decisions", () => {
  it("lists decisions newest first, by title, and points at what they read with", () => {
    const onOpen = vi.fn();
    render(<DecisionsView board={readBoard(data)} onOpen={onOpen} />);
    const titles = screen.getAllByRole("button").map((node) => node.textContent ?? "");
    expect(titles[0]).toContain("Existing identifiers stay");
    expect(titles[0]).toMatch(/ago/);
    expect(titles[0]).toContain("reads with Entity identity is a coordination-free ULID");
    fireEvent.click(screen.getByRole("button", { name: /Existing identifiers stay/ }));
    expect(onOpen).toHaveBeenCalledWith("D-010");
  });
});
