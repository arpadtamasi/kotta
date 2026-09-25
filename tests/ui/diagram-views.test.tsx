// @vitest-environment jsdom
//
// The four diagram views, drawn from one fifteen-odd node workspace. Mermaid itself needs a real
// layout engine, so it is replaced here by a stand-in that returns an SVG naming the source it was
// given; what is tested is what the board asks Mermaid to draw, and everything around the drawing.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { App, EntityDrawer, SpecView, readBoard } from "../../ui/src/App";
import { EntityMapView, ProvenanceSummary, StateMachineView, StoryMapView, UseCaseView } from "../../ui/src/views";
import {
  ACTOR, CONVERSATION, COSTS, EXPORT, GOAL, INVOICE, ORDER, ORDER_MACHINE, PAYMENT, REVIEW, modelWorkspace,
} from "./model-fixture";

const drawn: string[] = [];
vi.mock("mermaid", () => ({
  default: {
    initialize: () => {},
    render: async (id: string, source: string) => {
      drawn.push(source);
      return { svg: `<svg id="${id}" xmlns="http://www.w3.org/2000/svg"><g class="node" id="${id}-flowchart-U1-3"><text>drawn</text></g></svg>` };
    },
  },
}));

const board = () => readBoard(modelWorkspace);
const CONVERSATION_TEXT = "# Conversation\n\n## Accounting\n\nAnna: every hour has an owner.\n\n## Something else\n\nNot this.\n";

beforeEach(() => {
  drawn.length = 0;
  vi.stubGlobal("fetch", (input: unknown) => {
    const url = String(input);
    if (url.startsWith("/api/narrative")) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ path: CONVERSATION, content: CONVERSATION_TEXT }) } as Response);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(modelWorkspace) } as Response);
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** The accessibility check every view passes: no serious or critical axe violation. */
async function accessible(container: HTMLElement) {
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  const blocking = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
  expect(blocking.map((violation) => `${violation.id}: ${violation.nodes.map((n) => n.html).join(" | ")}`)).toEqual([]);
}
function noProcess(text: string) {
  for (const word of ["task", "batch", "claim", "approval", "observation", "decision"]) expect(text.toLowerCase(), `no "${word}"`).not.toContain(word);
}

describe("the use case view", () => {
  it("draws actors, use cases and goals with their provenance, and lists every node under it", async () => {
    const onOpen = vi.fn();
    const { container } = render(<UseCaseView board={board()} agentOnly={false} onOpen={onOpen} />);
    const figure = await screen.findByRole("img", { name: "Use case diagram" });
    expect(drawn[0]).toMatch(/^flowchart LR/);
    expect(drawn[0]).toContain("subgraph cases[\"Use cases\"]");
    // A drawn node opens its node.
    fireEvent.click(figure.querySelector("text")!);
    expect(onOpen).toHaveBeenCalledWith(REVIEW);
    expect(container.querySelectorAll(".node-detail").length).toBe(7);
    expect(container.querySelector(".diagram__scroll")).toBeTruthy();
    noProcess(container.textContent ?? "");
    await accessible(container);
  });

  it("opens a listed node onto its sections and its edges as links", () => {
    const onOpen = vi.fn();
    render(<UseCaseView board={board()} agentOnly={false} onOpen={onOpen} />);
    const item = screen.getByText("Export a report", { selector: ".node-detail__title" }).closest("details")!;
    fireEvent.click(within(item).getByText("Export a report", { selector: ".node-detail__title" }));
    fireEvent.click(within(item).getByRole("button", { name: /Operator/ }));
    expect(onOpen).toHaveBeenCalledWith(ACTOR);
    expect(within(item).getByText("Intent")).toBeTruthy();
  });
});

describe("the story view", () => {
  it("puts each story under its actor, with its Story and Value", async () => {
    const { container } = render(<StoryMapView board={board()} agentOnly={false} onOpen={() => {}} />);
    const columns = [...container.querySelectorAll(".story-map__column")].map((column) => column.getAttribute("aria-label"));
    expect(columns).toEqual(["Operator", "Reviewer", "No actor"]);
    const operator = container.querySelector(".story-map__column")!;
    expect(operator.querySelectorAll(".story-card").length).toBe(2);
    expect(within(operator as HTMLElement).getByText("As an operator I want every open hour listed.")).toBeTruthy();
    expect(within(operator as HTMLElement).getByText("Nothing slips.")).toBeTruthy();
    noProcess(container.textContent ?? "");
    await accessible(container);
  });
});

describe("the entity view", () => {
  it("draws the edges it read from prose, and says so", async () => {
    const { container } = render(<EntityMapView board={board()} agentOnly={false} onOpen={() => {}} />);
    await screen.findByRole("img", { name: "Entity map" });
    expect(screen.getByRole("note").textContent).toContain("read from prose, not from typed edges");
    expect(drawn[0]).toContain("E0 --> E1"); // Order's meaning names payments
    expect(drawn[0]).toContain("E2 --> E0"); // Invoice names the order
    expect(container.querySelectorAll(".node-detail").length).toBe(3);
    await accessible(container);
  });
});

describe("the state machine view", () => {
  it("draws what reads as transitions and keeps the prose it could not", async () => {
    const { container } = render(<StateMachineView board={board()} agentOnly={false} onOpen={() => {}} />);
    await screen.findByRole("img", { name: "State machine: Order lifecycle" });
    expect(drawn).toHaveLength(1);
    expect(drawn[0]).toMatch(/^stateDiagram-v2\n  direction LR/);
    const payment = screen.getByRole("region", { name: "Payment lifecycle" });
    expect(payment.textContent).toContain("it cannot be drawn mechanically");
    expect(payment.textContent).toContain("the bank answers");
    const order = screen.getByRole("region", { name: "Order lifecycle" });
    expect(order.textContent).toContain("Nothing else moves an order.");
    noProcess(container.textContent ?? "");
    await accessible(container);
  });
});

describe("provenance on the board", () => {
  it("counts the levels and the deciders apart, and filters to what the agent decided", () => {
    const onAgentOnly = vi.fn();
    render(<ProvenanceSummary board={board()} agentOnly={false} onAgentOnly={onAgentOnly} />);
    const summary = screen.getByRole("region", { name: "Provenance" });
    expect(summary.textContent).toContain("stated1");
    expect(summary.textContent).toContain("partly inferred2");
    expect(summary.textContent).toContain("inferred2");
    expect(summary.textContent).toContain("the agent decided3");
    expect(summary.textContent).toContain("unmarked 11");
    const filter = within(summary).getByRole("button", { name: /only what the agent decided/ });
    expect(filter.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(filter);
    expect(onAgentOnly).toHaveBeenCalledWith(true);
  });

  it("marks a node by its own frontmatter and leaves an unmarked node without a badge", () => {
    const { container } = render(<SpecView board={board()} filter="all" form="all" query="" onFilter={() => {}} onForm={() => {}} onQuery={() => {}} onOpen={() => {}} />);
    const row = (title: string) => screen.getByText(title).closest(".spec-row")!;
    expect(row("Work is accounted for").textContent).toContain("partly inferred");
    expect(row("Work is accounted for").textContent).toContain("agent proposed, you approved");
    expect(row("Operator").textContent).toContain("you said it");
    expect(row("Payment").querySelector(".prov")).toBeNull();
    expect(container.querySelectorAll(".spec-row").length).toBe(modelWorkspace.spec!.length);
  });

  it("the review filter narrows the list and dims the rest of the diagram", async () => {
    render(<SpecView board={board()} filter="all" form="all" query="" agentOnly onFilter={() => {}} onForm={() => {}} onQuery={() => {}} onOpen={() => {}} />);
    expect([...document.querySelectorAll(".spec-row__title")].map((title) => title.textContent).sort())
      .toEqual(["Comment on a change", "Costs \"stay\" visible (monthly) [ops]", "Review a change"]);
    cleanup();
    render(<UseCaseView board={board()} agentOnly onOpen={() => {}} />);
    await screen.findByRole("img", { name: "Use case diagram" });
    expect(drawn.at(-1)).toMatch(/class [AUG0-9,]+ dimmed/);
    expect(screen.getByText(/Showing 2 of 7/)).toBeTruthy();
  });

  it("the whole board switches views, and the filter follows", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Specification" });
    const rail = screen.getByRole("navigation", { name: "Board sections" });
    for (const [label, heading] of [["Use cases", "Use cases"], ["Stories", "Stories"], ["Entities", "Entities"], ["State machines", "State machines"]]) {
      await act(async () => { fireEvent.click(within(rail).getByRole("button", { name: new RegExp(`^${label}`) })); });
      expect(await screen.findByRole("heading", { level: 2, name: heading })).toBeTruthy();
    }
    noProcess(document.body.textContent ?? "");
  });
});

describe("from a node to its narrative", () => {
  it("shows the quote, what was filled in, and the cited part of the change's conversation", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", (input: unknown) => {
      requests.push(String(input));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ path: CONVERSATION, content: CONVERSATION_TEXT }) } as Response);
    });
    render(<EntityDrawer id={GOAL} board={board()} onClose={() => {}} onOpen={() => {}} />);
    const panel = screen.getByText("Where this comes from").closest("section")!;
    expect(panel.textContent).toContain("Anna, 10:02: every hour has an owner");
    expect(panel.textContent).toContain("the monthly cadence");
    const [excerpt] = await within(panel).findAllByText("Anna: every hour has an owner.");
    expect(excerpt.closest("blockquote")).toBeTruthy();
    expect(panel.querySelector("blockquote.narrative")?.textContent).not.toContain("Not this.");
    // Only the change folder's narrative is fetched; a bare file name is shown as text.
    expect(requests).toEqual([`/api/narrative?path=${encodeURIComponent(CONVERSATION)}`]);
    expect(panel.textContent).toContain("proposal.md");
  });

  it("a node without provenance has no such section", () => {
    render(<EntityDrawer id={PAYMENT} board={board()} onClose={() => {}} onOpen={() => {}} />);
    expect(screen.queryByText("Where this comes from")).toBeNull();
  });

  it("says so when the narrative cannot be read", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: "No such file." }) } as Response));
    render(<EntityDrawer id={GOAL} board={board()} onClose={() => {}} onOpen={() => {}} />);
    await waitFor(() => expect(document.body.textContent).toContain("The narrative could not be read: No such file."));
  });
});

// Unused ids stay referenced so the fixture's shape is visible from here.
void [COSTS, EXPORT, INVOICE, ORDER, ORDER_MACHINE];
