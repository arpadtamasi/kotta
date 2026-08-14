// @vitest-environment jsdom
//
// The three chain views and Decisions. What they must get right: the design's numbering and
// wording, filters that filter, and — the rule that outranks the design's own mock — an entity
// is named by its title, with the short id only as a marker beside it (D-003, D-01kz1yqm…).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
    render(<ObservationsView board={board} filter="new" sort="created-desc" onFilter={() => {}} onSort={() => {}} onOpen={() => {}} />);
    expect(screen.getByRole("heading", { name: "Observations" })).toBeDefined();
    expect(screen.getByText("New information, ordered with its age visible.")).toBeDefined();
    expect(screen.queryByText(".kotta/observations/")).toBeNull();
  });

  it("shows the waiting queue by title, ages it, and reports a filter change", () => {
    const onFilter = vi.fn();
    render(<ObservationsView board={board} filter="new" sort="created-desc" onFilter={onFilter} onSort={() => {}} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /The local UI is visually overcrowded/ });
    expect(row.textContent).toContain("created");
    expect(row.textContent).toContain("seen during Make the UI workspace argument explicit");
    expect(screen.queryByText("The board hides worktree state")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /resolved/ }));
    expect(onFilter).toHaveBeenCalledWith("resolved");
  });

  it("shows what a dispositioned observation became, by title", () => {
    render(<ObservationsView board={board} filter="resolved" sort="created-desc" onFilter={() => {}} onSort={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("→ Reading the board makes no per-file git call")).toBeDefined();
  });

  it("sorts by creation or severity without relabeling severity as priority", () => {
    const sortable = readBoard(workspace({ observations: [
      observation("F-100", "Older high severity", { severity: "high", created_at: "2026-06-01" }),
      observation("F-101", "Newer medium severity", { severity: "medium", created_at: "2026-08-01" }),
    ] }));
    const onSort = vi.fn();
    const { container } = render(<ObservationsView board={sortable} filter="all" sort="severity-desc" onFilter={() => {}} onSort={onSort} onOpen={() => {}} />);
    expect([...container.querySelectorAll(".obs__title")].map((node) => node.textContent)).toEqual(["Older high severity", "Newer medium severity"]);
    fireEvent.change(screen.getByRole("combobox", { name: "sort" }), { target: { value: "created-asc" } });
    expect(onSort).toHaveBeenCalledWith("created-asc");
  });
});

describe("Contracts", () => {
  const contracts = (filter: "all" | "defined" = "all", query = "") =>
    render(<ContractsView board={readBoard(data)} filter={filter} sort="created-desc" onFilter={() => {}} onSort={() => {}} query={query} onQuery={() => {}} onOpen={() => {}} />);

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
    render(<ContractsView board={future} filter="all" sort="created-desc" onFilter={() => {}} onSort={() => {}} query="" onQuery={() => {}} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /Future timestamp/ });
    expect(row.textContent).toContain("Unavailable");
    expect(daysSince("2999-01-01", Date.parse("2026-08-14"))).toBeNull();
  });

  it("sorts contracts by canonical priority and by creation date", () => {
    const sortable = readBoard(workspace({ contracts: [
      contract("T-100", "Older low priority", { priority: "low", created_at: "2026-06-01" }),
      contract("T-101", "Newer high priority", { priority: "high", created_at: "2026-08-01" }),
    ] }));
    const priority = render(<ContractsView board={sortable} filter="all" sort="priority-desc" onFilter={() => {}} onSort={() => {}} query="" onQuery={() => {}} onOpen={() => {}} />);
    expect([...priority.container.querySelectorAll(".ctr__title")].map((node) => node.textContent)).toEqual(["Newer high priorityT-101", "Older low priorityT-100"]);
    cleanup();
    const created = render(<ContractsView board={sortable} filter="all" sort="created-asc" onFilter={() => {}} onSort={() => {}} query="" onQuery={() => {}} onOpen={() => {}} />);
    expect([...created.container.querySelectorAll(".ctr__title")].map((node) => node.textContent)).toEqual(["Older low priorityT-100", "Newer high priorityT-101"]);
  });
});

describe("Batches", () => {
  it("shows a dependency graph with progress, goal and age", () => {
    render(<BatchesView board={board} filter="all" sort="created-desc" onFilter={() => {}} onSort={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("Hierarchy, dependency order, progress and age.")).toBeDefined();
    const tree = screen.getByRole("region", { name: "Batch: Trustworthy daily use" });
    expect(within(tree).getByLabelText("1 of 2 complete")).toBeDefined();
    expect(within(tree).getByText(/One module: truthful execution state/)).toBeDefined();
    expect(within(tree).getByText(/created/)).toBeDefined();
    expect(within(tree).getByLabelText("Execution waves for Trustworthy daily use")).toBeDefined();
  });

  it("keeps child batches visible in their parent tree and filters trees by nested state", () => {
    const nestedContracts = [
      contract("T-100", "Child foundation", { status: "done", batch: "P-101" }),
      contract("T-101", "Child delivery", { status: "active", batch: "P-101", depends_on: ["T-100"] }),
    ];
    const nested = readBoard(workspace({
      contracts: nestedContracts,
      batches: [
        batch("P-100", "Parent programme", { status: "defined", contracts: [], batches: ["P-101"], created_at: "2026-06-01" }),
        batch("P-101", "Nested delivery batch", { status: "active", contracts: nestedContracts.map((item) => item.id), created_at: "2026-07-01" }),
        batch("P-200", "Standalone done batch", { status: "done", created_at: "2026-08-01" }),
      ],
    }));
    const onOpen = vi.fn();
    const { container } = render(<BatchesView board={nested} filter="active" sort="created-asc" onFilter={() => {}} onSort={() => {}} onOpen={onOpen} />);
    const roots = [...container.querySelectorAll<HTMLElement>(".batch-tree__root")];
    expect(roots).toHaveLength(1);
    expect(roots[0].getAttribute("aria-label")).toBe("Batch: Parent programme");
    expect(screen.queryByText("Standalone done batch")).toBeNull();
    const child = within(screen.getByLabelText("Nested batches in Parent programme")).getByRole("button", { name: /Nested delivery batch/ });
    expect(child.textContent).toContain("2 direct · 2 total contracts");
    fireEvent.click(child);
    expect(onOpen).toHaveBeenCalledWith("P-101");
    expect(screen.getByText("Wave 1")).toBeDefined();
    expect(screen.getByText("Wave 2")).toBeDefined();
    expect(screen.getAllByText(/in Nested delivery batch/)).toHaveLength(2);
    expect(screen.getByText("completed · metrics not recorded")).toBeDefined();
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
