import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { answerPause, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * The model is shaped the way the product is told to a stranger (BR-01m4gvndx1scrdc836cmjp58dq): the
 * shipped rules and skills have the agent tell the product first, and `kotta plan` names a proposal
 * that tells no stranger, without blocking.
 */
describe("told to a stranger", () => {
  test("the rules and skills Kotta ships tell the agent to tell the product first and propose, not decide, the purpose (EX-01m4gvne2grr08rfqj7m6jf3x5)", () => {
    const rules = readFileSync(resolve("templates/AGENTS.md"), "utf8");
    expect(rules).toContain("**Tell the product to a stranger first.**");
    expect(rules).toContain("A\n   purpose, a journey or a measure the human has not said is a question under `Open decisions`");
    expect(rules).toContain("support someone does as a use case off the journey");
    const planChange = readFileSync(resolve("skills/plan-change/SKILL.md"), "utf8");
    expect(planChange).toContain("## Tell the product to a stranger first");
    for (const skill of ["impact-mapping", "use-case-modeling", "story-mapping"]) {
      expect(readFileSync(resolve(`skills/${skill}/SKILL.md`), "utf8")).toContain("told to a stranger");
    }
  });

  test("the plan names a proposal that tells no stranger, and still lets it reach the gate (EX-01m4gvy0tm10wvsfyv7kwdac8j)", () => {
    const root = planningWorkspace("told-stranger", null);
    answerPause(root);
    const planned = run(root, ["plan", "add-pause"]);
    expect(planned.status).toBe(0);
    expect(planned.stdout).toContain("The proposal tells no stranger.");
    expect(readFileSync(join(root, ".kotta/changes/add-pause/planning.md"), "utf8")).toContain("it has no `## Told to a stranger` section");

    const proposal = readFileSync(join(root, ".kotta/changes/add-pause/proposal.md"), "utf8");
    write(root, ".kotta/changes/add-pause/proposal.md", proposal.replace(/^(# .+\n)/m, "$1\n## Told to a stranger\n\nA game players finish: they start it, pause it, and quit only when they mean to.\n\n"));
    const told = run(root, ["plan", "add-pause"]);
    expect(told.stdout).not.toContain("tells no stranger");
  });
});
