import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { APPROVAL_ACTIONS } from "../../src/commands/approval.js";

/**
 * Consequential transitions are human gates, on every surface
 * (BR-01m0f0wn89zb3wfb3t3y4d20a7): the commands that demand approval and the actions the calling
 * chat can put to a human are one set, not two lists that happen to agree. This proves that clause
 * of the rule; the receipt the same rule requires is proven in approval-receipt.test.ts.
 *
 * The measurement that produced this: five of the six gates were reachable from chat and
 * `decision.create` was not, so recording a decision — the one thing rule 5 exists to protect —
 * was the gate that sent the human to the terminal. Nothing failed while that was true, because
 * nothing compared the two sides. This does, as a set, so a seventh gate added to either side
 * fails here until it reaches both.
 */

const cli = resolve("dist/cli/index.js");

/** The action id a CLI command path stands for: `task close` gates `task.close`. */
const GATE_IDS: Record<string, string> = {
  "task close": "task.close",
  "task cancel": "task.cancel",
  // The CLI spells the reopen; the approval action names what it does to the review.
  "task reopen": "task.request-changes",
  "batch close": "batch.close",
  "observation resolve": "observation.resolve",
  "decision create": "decision.create",
};

function help(path: string[]): string {
  const result = spawnSync("node", [cli, ...path, "--help"], { encoding: "utf8", env: { ...process.env, COLUMNS: "80" } });
  return `${result.stdout}${result.stderr}`;
}

/**
 * Read from the source rather than by walking `--help` on every command: the walk costs a process
 * per command, and the registry's own totality test already proves the source and the binary agree
 * on what commands exist.
 */
function approvalGatedCommands(): string[] {
  const source = readFileSync(resolve("src/cli/index.ts"), "utf8");
  const gated = new Set<string>();
  let current: string | null = null;
  for (const line of source.split(/\r?\n/)) {
    const declared = /^defineCommand\((?:"([a-z]+)"|null), "([a-z-]+)/.exec(line);
    if (declared) current = declared[1] ? `${declared[1]} ${declared[2]}` : declared[2];
    if (current && /\.option\("--approve"/.test(line)) { gated.add(current); current = null; }
  }
  return [...gated].sort();
}

describe("a gate reaches both surfaces or it is not a gate", () => {
  test("every command that demands approval is an action the calling chat can put to a human", () => {
    const gated = approvalGatedCommands();
    // The map is the only place the two spellings meet; an unmapped gate is a gate nobody checked.
    expect(gated.filter((command) => !GATE_IDS[command]), "every gated command maps to an action").toEqual([]);
    expect(gated.map((command) => GATE_IDS[command]).sort()).toEqual([...APPROVAL_ACTIONS].sort());
  });

  test("and the commands it names really carry the approval flag", () => {
    // The source read above is a shortcut; this proves the binary agrees for each mapped command.
    for (const command of Object.keys(GATE_IDS)) {
      expect(help(command.split(" ")), `${command} --approve`).toContain("--approve");
    }
  }, 60_000);
});
