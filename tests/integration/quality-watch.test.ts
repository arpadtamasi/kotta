import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { proseWithoutNode } from "../../src/commands/plan.js";
import { answerPause, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * Kotta watches for quality requirements: the rules and skills it ships have the agent record a
 * quality requirement where it is said (BR-01m4gj0efhjmpmdw58am4f0c46), and `kotta plan` names what
 * the proposal promises without a node (BR-01m4gj0endmfx601pm929wcp41).
 */
describe("quality said is quality recorded", () => {
  test("the shipped rules and skills tell the agent to draft it as a quality attribute, never a build note (EX-01m4gj0etwk33zvh7htrxgszcx)", () => {
    const rules = readFileSync(resolve("templates/AGENTS.md"), "utf8");
    expect(rules).toContain("**Quality said is quality recorded.**");
    expect(rules).toContain("draft it into the change as a quality attribute, with a response and");
    expect(rules).toContain("Never leave it as a build note in the proposal's prose");
    const planChange = readFileSync(resolve("skills/plan-change/SKILL.md"), "utf8");
    expect(planChange).toContain("**Quality said is quality recorded.**");
    expect(planChange).toContain("ask for it under\n   `## Open decisions` rather than choosing it");
    expect(readFileSync(resolve("skills/quality-scenarios/SKILL.md"), "utf8")).toContain("Watch for quality that is said in passing");
  });

  test("the plan lists build notes no node carries, asks of each, and does not block (EX-01m4gj0f0zga6schnfnzsxsxhx)", () => {
    const root = planningWorkspace("quality-watch", null);
    answerPause(root);
    write(root, ".kotta/changes/add-pause/proposal.md", [
      "# Add pause", "", "## Why", "", "Players step away.", "", "## What changes", "",
      "- **Pause freezes the timer** (new).",
      "- The 9px labels become at least 11px.",
      "- Search matches body text.", "", "## Open decisions", "", "None.", "",
    ].join("\n"));
    const planned = run(root, ["plan", "add-pause"]);
    expect(planned.status).toBe(0);
    expect(planned.stdout).toContain("Proposal items naming no node: 2.");
    const report = readFileSync(join(root, ".kotta/changes/add-pause/planning.md"), "utf8");
    expect(report).toContain("Is each a promise — a quality attribute, a rule — that needs a node, or work that keeps no promise?");
    expect(report).toContain("- proposal.md:10 — The 9px labels become at least 11px.");
    expect(report).toContain("- proposal.md:11 — Search matches body text.");
    expect(report).not.toContain("— **Pause freezes the timer** (new).");
  });

  test("an item naming a node by title or id is not listed; items outside What changes are not read", () => {
    const nodes = [{ id: "BR-01m4gh00000000000000000001", form: "business-rule", path: "x", data: { title: "Pause freezes the timer" } }];
    expect(proseWithoutNode("## Why\n\n- a reason\n\n## What changes\n\n- Pause freezes the timer, new.\n- See BR-00000001.\n- A note.\n", nodes)).toEqual([{ line: 9, text: "A note." }]);
  });
});
