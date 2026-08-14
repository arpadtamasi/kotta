import { describe, expect, test } from "vitest";
import { normalizeAgentOutput } from "../../src/core/execution-metrics.js";

describe("execution metric normalization", () => {
  test("normalizes Claude's result and cache-aware usage", () => {
    const normalized = normalizeAgentOutput("claude", JSON.stringify({
      type: "result",
      result: "Implemented the contract.",
      usage: { input_tokens: 120, cache_creation_input_tokens: 20, cache_read_input_tokens: 60, output_tokens: 35 },
    }));

    expect(normalized.report).toBe("Implemented the contract.");
    expect(normalized.usage).toEqual({ input_tokens: 200, output_tokens: 35, total_tokens: 235, cached_input_tokens: 60 });
  });

  test("normalizes the last Codex agent message and completed-turn usage", () => {
    const normalized = normalizeAgentOutput("codex", [
      JSON.stringify({ type: "thread.started", thread_id: "thread-1" }),
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "First update" } }),
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Implemented the contract." } }),
      JSON.stringify({ type: "turn.completed", usage: { input_tokens: 400, cached_input_tokens: 250, output_tokens: 75 } }),
    ].join("\n"));

    expect(normalized.report).toBe("Implemented the contract.");
    expect(normalized.usage).toEqual({ input_tokens: 400, output_tokens: 75, total_tokens: 475, cached_input_tokens: 250 });
  });

  test("keeps unsupported or malformed output without inventing usage", () => {
    expect(normalizeAgentOutput("custom", "plain report\n")).toEqual({ report: "plain report\n", usage: null });
    expect(normalizeAgentOutput("codex", "not jsonl\n")).toEqual({ report: "not jsonl\n", usage: null });
    expect(normalizeAgentOutput("claude", JSON.stringify({ result: "Done", usage: { input_tokens: -1, output_tokens: 4 } }))).toEqual({ report: "Done", usage: null });
  });
});
