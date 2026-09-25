// @vitest-environment jsdom
//
// The board is a pure projection of the specification. Opening the view and every drawer must
// still issue one kind of request — a GET of the workspace — and nothing else.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "../../ui/src/App";
import { node, workspace } from "./fixtures";

const GOAL = "G-01m0f0wn89bsqrswjac57sdzez";
const RULE = "BR-01m0f0wn89c50fe1mz5yn1nw85";

const data = workspace({
  spec: [
    node(GOAL, "goal", "Work is accounted for"),
    node(RULE, "business-rule", "Identifiers are permanent", { edges: { goal: [GOAL] }, accepted: ["unimplemented: nothing keeps it yet"] }),
  ],
  notices: ["The board reads .kotta/ from the 'main' ref, not from the working tree."],
});

let calls: Array<{ url: string; method: string }>;

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", (input: unknown, init?: { method?: string }) => {
    calls.push({ url: String(input), method: init?.method ?? "GET" });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function boot() {
  render(<App />);
  await screen.findByRole("heading", { name: "Specification" });
}

describe("Passive board", () => {
  it("loads the workspace through one GET and nothing else", async () => {
    await boot();
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(new Set(calls.map((call) => call.url))).toEqual(new Set(["/api/workspace"]));
    expect(new Set(calls.map((call) => call.method))).toEqual(new Set(["GET"]));
  });

  it("keeps the view and the drawer free of mutation controls, and says it is read-only", async () => {
    await boot();
    let rendered = document.body.innerHTML;
    fireEvent.click(screen.getByText("Identifiers are permanent"));
    rendered += document.body.innerHTML;
    fireEvent.keyDown(window, { key: "Escape" });

    expect(rendered).not.toMatch(/<form\b/);
    expect(rendered).not.toMatch(/type="submit"/);
    expect(rendered.toLowerCase()).toContain("read-only");
    expect(screen.getByRole("status").textContent).toContain("not reading what you are editing");
  });

  it("clicking every control still issues no write", async () => {
    await boot();
    for (const control of screen.getAllByRole("button")) {
      await act(async () => { fireEvent.click(control); });
      fireEvent.keyDown(window, { key: "Escape" });
    }
    await waitFor(() => expect(calls.every((call) => call.method === "GET" && call.url === "/api/workspace")).toBe(true));
  });

  it("keeps the last good read on screen and offers a retry when a refresh fails", async () => {
    await boot();
    vi.stubGlobal("fetch", () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response));
    fireEvent.click(screen.getByRole("button", { name: /Refresh/ }));
    const banner = await screen.findByRole("alert");
    expect(banner.textContent).toContain("Last read failed.");
    expect(banner.textContent).toContain("GET /api/workspace");
    expect(banner.textContent).toContain("HTTP 500");
    // The list is still there — one failing read does not blank the board.
    expect(screen.getByText("Work is accounted for")).toBeDefined();
  });
});
