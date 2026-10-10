import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { readSession } from "../../src/conversation/sessions.js";
import { distill } from "../../src/conversation/distill.js";
import { answerPause, planningWorkspace, run, write, node, PAUSE, QUIT } from "./planning-fixture.js";

/**
 * The planning phase sees everything (tervezes-mindent-lat): the plan measures against approved open
 * changes too (BR-01m4kazy06s3yg2d2pgw26f583), the distillate keeps the answers to structured
 * questions and the messages typed while the agent works (BR-01m4kazy7hhmvt1k2kqx5xde8b), and a
 * citation of an archived conversation resolves (BR-01m4kazyfbvyapfr0h6dcx1n3y).
 */
describe("the planning phase sees everything", () => {
  test("an answer chosen from options, and a message sent while the agent works, are the human's (EX-01m4kazyzdk56c5vmvp0z15gs5)", () => {
    const dir = mkdtempSync(join(tmpdir(), "kotta-answers-"));
    const log = join(dir, "session.jsonl");
    const lines = [
      { type: "user", timestamp: "2026-10-10T16:30:00Z", message: { role: "user", content: "kezeld a hiákat" } },
      { type: "assistant", timestamp: "2026-10-10T16:35:00Z", message: { role: "assistant", content: [{ type: "tool_use", name: "AskUserQuestion", input: {} }] } },
      { type: "user", timestamp: "2026-10-10T16:40:00Z", message: { role: "user", content: [{ type: "tool_result", content: "Your questions have been answered" }] },
        toolUseResult: { questions: [{ question: "Mi a Kotta célja egy mondatban?", options: [{ label: "Több munka" }, { label: "Közös igazság" }] }], answers: { "Mi a Kotta célja egy mondatban?": "nem átlátható, mit csinál a gép" } } },
      { type: "attachment", timestamp: "2026-10-10T16:40:19Z", attachment: { type: "queued_command", prompt: [{ type: "text", text: "és későn derül ki" }], source_uuid: "u1", origin: { kind: "human" }, timestamp: "2026-10-10T16:40:19Z" } },
      { type: "attachment", timestamp: "2026-10-10T16:40:20Z", attachment: { type: "queued_command", prompt: [{ type: "text", text: "és későn derül ki" }], source_uuid: "u1", origin: { kind: "human" } } },
    ];
    writeFileSync(log, lines.map((line) => JSON.stringify(line)).join("\n"));
    const session = readSession(log);
    const distilled = distill([{ session, source: "session.jsonl" }]);
    expect(distilled.questions).toHaveLength(1);
    expect(distilled.questions[0].human.text).toBe("nem átlátható, mit csinál a gép");
    expect(session.utterances.map((utterance) => [utterance.speaker, utterance.text])).toEqual([
      ["human", "kezeld a hiákat"],
      ["agent", "Options: Több munka / Közös igazság\n\nMi a Kotta célja egy mondatban?"],
      ["human", "nem átlátható, mit csinál a gép"],
      ["human", "és későn derül ki"],
    ]);
  });

  test("a clash with an approved open change is a conflict candidate, and the report names the change laid over (EX-01m4kazyqsnc6nyr8j8n3qwkct)", () => {
    const root = planningWorkspace("agreement", null);
    answerPause(root);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    // A second change rewrites the rule only the approved open change adds.
    write(root, ".kotta/changes/second/proposal.md", "# Second\n\n## Told to a stranger\n\nA game.\n\n## Why\n\nMore.\n\n## What changes\n\n- **Pause freezes the timer** changes.\n\n## Open decisions\n\nNone.\n");
    write(root, `.kotta/changes/second/model/business-rules/pause-freezes-the-timer-${PAUSE.slice(-8)}.md`, node({ id: PAUSE, form: "business-rule", overall: true, title: "Pause freezes the timer", capability: "game/session", accepted: ["unimplemented: fixture"], provenance: { level: "stated", decided_by: "human", sources: ["proposal.md"], quote: "More." } }, { Rule: "While a game is paused its clock SHALL advance at half speed.", Rationale: "More.", Scope: "Every game." }));
    const planned = run(root, ["plan", "second"]);
    const report = readFileSync(join(root, ".kotta/changes/second/planning.md"), "utf8");
    expect(report).toContain("with the approved open change `add-pause` laid over it");
    expect(report).toMatch(/The timer holds while paused[^\n]*names the changed node in 'subjects'/);
    // The second change's own measuring may still block on its merged view; the candidate is what this example is about.
    expect(planned.stdout + planned.stderr).toContain("Conflict candidates awaiting judgement");
  });

  test("a citation of an archived change's conversation resolves; one of no change at all does not (EX-01m4kazz5wsg016051cs09yd2v)", () => {
    const root = planningWorkspace("archived-cite", null);
    answerPause(root);
    write(root, ".kotta/changes/archive/2026-10-08-older/conversation.md", "# Beszélgetés\n\n### SZ2 · 2026-10-08 10:00 UTC\n\n> igen\n");
    const quit = readFileSync(join(root, ".kotta/changes/add-pause/model/business-rules", (require("node:fs") as typeof import("node:fs")).readdirSync(join(root, ".kotta/changes/add-pause/model/business-rules")).find((name: string) => name.includes("quit"))!), "utf8");
    void quit; void QUIT;
    const files = (require("node:fs") as typeof import("node:fs")).readdirSync(join(root, ".kotta/changes/add-pause/model/business-rules"));
    const target = join(root, ".kotta/changes/add-pause/model/business-rules", files[0]);
    const text = readFileSync(target, "utf8").replace(/sources:\n/, "sources:\n    - \".kotta/changes/older/conversation.md · SZ2\"\n    - \".kotta/changes/never/conversation.md · SZ1\"\n");
    writeFileSync(target, text);
    run(root, ["plan", "add-pause"]);
    const report = readFileSync(join(root, ".kotta/changes/add-pause/planning.md"), "utf8");
    expect(report).not.toContain("cites “.kotta/changes/older/conversation.md · SZ2”");
    expect(report).toContain("cites “.kotta/changes/never/conversation.md · SZ1”");
  });
});
