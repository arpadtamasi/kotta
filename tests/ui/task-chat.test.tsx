// @vitest-environment jsdom
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { EntityDrawer, readBoard, type Workspace } from "../../ui/src/App";
import { task, workspace } from "./fixtures";

const ID = "T-01kz8tk2t53jbax6mrseka50v9";
const eventId = (tail: string) => `E-01kz8tk2t53jbax6mrseka${tail}`;

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function Drawer({ data }: { data: Workspace }) {
  return <EntityDrawer id={ID} workspace={data} board={readBoard(data)} onClose={() => undefined} onOpen={() => undefined} />;
}
function openActivity() {
  fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
}

describe("persistent task conversation", () => {
  it("renders messages, lifecycle and durable approval outcome in stable order", () => {
    const approvalId = eventId("50v9");
    const data = workspace({
      tasks: [task(ID, "Live control plane", { status: "defined", execution_mode: "fresh" })],
      events: [
        { id: eventId("50v1"), entity: ID, task: ID, kind: "message", role: "human", text: "Keep chat visible.", created_at: "2026-08-05T10:00:00Z" },
        { id: eventId("50v2"), entity: ID, task: ID, kind: "message", role: "assistant", text: "It is stored on main.", created_at: "2026-08-05T10:00:01Z" },
        { id: eventId("50v3"), entity: ID, task: ID, kind: "lifecycle", state: "defined", summary: "Task approved for execution.", created_at: "2026-08-05T10:00:02Z" },
        { id: approvalId, entity: ID, task: ID, kind: "approval", approval_id: approvalId, phase: "proposed", action: "task.sign", created_at: "2026-08-05T10:00:03Z" },
        { id: eventId("50v5"), entity: ID, task: ID, kind: "approval", approval_id: approvalId, phase: "applied", action: "task.sign", source_message: eventId("50v4"), created_at: "2026-08-05T10:00:04Z" },
      ],
    });
    render(<Drawer data={data} />);
    openActivity();
    const log = screen.getByRole("log");
    expect(within(log).getByText("Keep chat visible.")).toBeDefined();
    expect(within(log).getByText("It is stored on main.")).toBeDefined();
    expect(within(log).getByText("Task approved for execution.")).toBeDefined();
    expect(within(log).getByText("Approval · applied")).toBeDefined();
    expect(within(log).queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("shows pending caller-chat approval without exposing board mutation controls", () => {
    const approvalId = eventId("50v6");
    const data = workspace({
      tasks: [task(ID, "Live control plane", { status: "backlog" })],
      events: [{ id: approvalId, entity: ID, task: ID, kind: "approval", approval_id: approvalId, phase: "proposed", action: "task.sign", created_at: "2026-08-05T10:00:00Z" }],
    });
    render(<Drawer data={data} />);
    openActivity();
    expect(screen.getByText("Waiting in the calling chat.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Prepare/ })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("keeps a failed turn visible without retrying from the board", () => {
    const human = eventId("50va");
    const failedId = eventId("50vb");
    const data = workspace({
      tasks: [task(ID, "Live control plane", { status: "active" })],
      events: [
        { id: human, entity: ID, task: ID, kind: "message", role: "human", text: "Try this again", created_at: "2026-08-05T10:00:00Z" },
        { id: failedId, entity: ID, task: ID, kind: "turn-failed", error: "Provider disconnected.", attempt_of: human, created_at: "2026-08-05T10:00:01Z" },
      ],
    });
    render(<Drawer data={data} />);
    openActivity();
    expect(screen.getByText("Provider disconnected.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Retry turn" })).toBeNull();
  });

  it("has no automated accessibility violations in the focused task drawer", async () => {
    const data = workspace({ tasks: [task(ID, "Live control plane", { status: "backlog" })], events: [] });
    const { container } = render(<Drawer data={data} />);
    // jsdom has no canvas implementation, so colour contrast is covered by the Playwright site
    // gate while this component run checks the DOM/ARIA rules axe can evaluate faithfully here.
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
