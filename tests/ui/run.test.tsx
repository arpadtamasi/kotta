// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RunOverlay, computeRunWaves, readBoard } from "../../ui/src/App";
import { batch, contract, workspace } from "./fixtures";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const members = [
  contract("T-001", "Finished foundation", { status: "done", batch: "P-001", assigned_agent: "codex", updated_at: "2026-08-01" }),
  contract("T-002", "Active implementation", { status: "active", batch: "P-001", assigned_agent: "codex", branch: "feat/T-002", claim: { contract: "T-002", agent: "codex", branch: "feat/T-002", worktree: ".worktrees/T-002", started_at: "2026-08-14T08:00:00Z" }, depends_on: ["T-001"], updated_at: "2026-08-04" }),
  contract("T-003", "Review the implementation", { status: "review", batch: "P-001", assigned_agent: "claude", branch: "feat/T-003", depends_on: ["T-002"], updated_at: "2026-08-03" }),
  contract("T-004", "Waiting parallel work", { status: "defined", batch: "P-001", depends_on: ["T-002"], updated_at: "2026-08-02" }),
  contract("T-005", "Canonically blocked work", { status: "defined", blocked: true, batch: "P-001", depends_on: ["T-003"], sections: { blocker: "waiting for a human decision" } }),
  contract("T-006", "Inconsistent backlog member", { status: "backlog", batch: "P-001", depends_on: ["T-003"] }),
];

const data = workspace({
  contracts: members,
  batches: [batch("P-001", "Wave restoration", {
    status: "active", contracts: members.map((member) => member.id),
    execution: { mode: "dependency-aware", parallelism: 3, stop_on_failure: true },
  })],
  events: [{
    id: "E-01kzzzzzzzzzzzzzzzzzzzzzzx", entity: "T-001", contract: "T-001", kind: "lifecycle", created_at: "2026-08-14T07:00:00Z",
    state: "execution-implemented", summary: "Executor completed.", payload: { started_at: "2026-08-14T06:47:30Z", completed_at: "2026-08-14T07:00:00Z", duration_ms: 750_000, token_usage: { input_tokens: 1000, output_tokens: 250, total_tokens: 1250 } },
  }],
});

function renderRun(over: { onClose?: () => void; onOpen?: (id: string) => void } = {}) {
  return render(<RunOverlay board={readBoard(data)} onClose={over.onClose ?? (() => undefined)} onOpen={over.onOpen ?? (() => undefined)} />);
}

describe("Run wave derivation", () => {
  it("builds stable dependency waves and keeps parallel members in membership order", () => {
    const result = computeRunWaves(members);
    expect(result.waves.map((wave) => wave.map((member) => member.id))).toEqual([
      ["T-001"],
      ["T-002"],
      ["T-003", "T-004"],
      ["T-005", "T-006"],
    ]);
    expect(result.remainder).toEqual([]);
  });

  it("ignores out-of-batch edges but leaves cyclic in-batch topology in an explicit remainder", () => {
    const malformed = [
      contract("T-010", "Cycle one", { depends_on: ["T-011"] }),
      contract("T-011", "Cycle two", { depends_on: ["T-010"] }),
      contract("T-012", "Missing dependency", { depends_on: ["T-999"] }),
    ];
    const result = computeRunWaves(malformed);
    expect(result.waves.map((wave) => wave.map((member) => member.id))).toEqual([["T-012"]]);
    expect(result.remainder.map((member) => member.id)).toEqual(["T-010", "T-011"]);
  });
});

describe("The Run overlay", () => {
  it("renders every batch member exactly once with explicit state and wave composition", () => {
    const { container } = renderRun();
    const cards = [...container.querySelectorAll<HTMLButtonElement>(".run__card")];
    expect(cards).toHaveLength(members.length);
    expect(cards.map((card) => card.textContent)).toEqual(expect.arrayContaining(members.map((member) => expect.stringContaining(member.title))));

    for (const state of ["done", "active", "review", "defined", "blocked", "backlog"]) {
      expect(within(screen.getByRole("dialog", { name: "The run" })).getByText(state, { selector: ".state" })).toBeDefined();
    }
    expect(screen.getByText("1 review · 1 waiting")).toBeDefined();
    expect(screen.getByText("1 blocked · 1 inconsistent")).toBeDefined();
    expect(screen.getByText("backlog member · inconsistent with an active batch")).toBeDefined();
    expect(screen.getByText("dependency-aware · parallelism 3 · stop on failure")).toBeDefined();
    expect(screen.getByLabelText("1 of 6 complete")).toBeDefined();
  });

  it("renders cyclic topology as an unresolved remainder instead of inventing waves", () => {
    const cyclic = [
      contract("T-010", "Cycle one", { status: "defined", batch: "P-010", depends_on: ["T-011"] }),
      contract("T-011", "Cycle two", { status: "defined", batch: "P-010", depends_on: ["T-010"] }),
    ];
    const cyclicData = workspace({
      contracts: cyclic,
      batches: [batch("P-010", "Malformed run", { status: "active", contracts: cyclic.map((member) => member.id) })],
    });
    render(<RunOverlay board={readBoard(cyclicData)} onClose={() => undefined} onOpen={() => undefined} />);
    expect(screen.getByText("Unresolved topology")).toBeDefined();
    expect(screen.getAllByText("dependency cycle or blocked chain")).toHaveLength(2);
    expect(document.querySelectorAll(".run__wave--unresolved .run__card")).toHaveLength(2);
  });

  it("keeps the graph visible while inspecting a card and offers both return paths", () => {
    const onOpen = vi.fn();
    renderRun({ onOpen });
    fireEvent.click(screen.getByRole("button", { name: /Active implementation/ }));

    expect(screen.getByLabelText("Execution waves for Wave restoration")).toBeDefined();
    expect(screen.getByText("Contract context")).toBeDefined();
    expect(screen.getByText("feat/T-002")).toBeDefined();
    expect(screen.getByText("T-001", { selector: ".run__facts dd" })).toBeDefined();
    expect(screen.getByRole("button", { name: /Active implementation/ }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Open full contract detail →" }));
    expect(onOpen).toHaveBeenCalledWith("T-002");
    fireEvent.click(screen.getByRole("button", { name: "← Recent executions" }));
    expect(screen.getByText("Recent executions")).toBeDefined();
    expect(screen.getByText(/implemented · Finished foundation/)).toBeDefined();
    expect(screen.getAllByText("12m 30s · 1,250 tokens")).toHaveLength(2);
  });

  it("keeps opening, selecting, scrolling and closing passive", () => {
    const fetch = vi.fn();
    const onClose = vi.fn();
    const onOpen = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { container } = renderRun({ onClose, onOpen });
    fireEvent.scroll(container.querySelector(".run__graph-scroll") as Element, { target: { scrollLeft: 120 } });
    fireEvent.click(screen.getByRole("button", { name: /Waiting parallel work/ }));
    fireEvent.click(screen.getByRole("button", { name: "← Recent executions" }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(fetch).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves parallel wave groups at the mobile breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 900 });
    const { container } = renderRun();
    const waveThree = screen.getByText("Wave 3").closest(".run__wave") as HTMLElement;
    const stack = waveThree.querySelector(".run__wave-stack") as HTMLElement;
    expect(within(stack).getByRole("button", { name: /Review the implementation/ })).toBeDefined();
    expect(within(stack).getByRole("button", { name: /Waiting parallel work/ })).toBeDefined();
    expect(container.querySelectorAll(".run__wave-unit")).toHaveLength(4);
    expect(container.querySelectorAll(".run__connector")).toHaveLength(3);
  });

  it("derives a live elapsed value from the claim instead of updated_at", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T09:30:00Z"));
    renderRun();
    const active = screen.getByRole("button", { name: /Active implementation/ });
    expect(active.textContent).toContain("running 1h 30m");
    expect(active.textContent).not.toContain("10d ago");
  });
});
