import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { describe, expect, test } from "vitest";
import { QUIT, answerPause, json, planningWorkspace, run } from "./planning-fixture.js";

/**
 * Archive never puts back an older accepted text (BR-01m4at3x2fffqepx85tmvf3hxw): the approval
 * records what every replaced node said at the yes, and archive refuses when one changed since.
 */

const quitRule = (root: string) => join(root, `.kotta/spec/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`);
const approval = (root: string) => join(root, ".kotta/changes/add-pause/approval.yaml");

function approved(label: string): string {
  const root = planningWorkspace(label, null);
  answerPause(root);
  expect(run(root, ["plan", "add-pause"]).status).toBe(0);
  expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
  return root;
}

describe("archive never puts back an older accepted text (BR-01m4at3x2fffqepx85tmvf3hxw)", () => {
  test("the approval records the fingerprint of every node the delta replaces (EX-01m0f0wn8am4hb2vy03wmn4brs)", () => {
    const root = approved("stale-receipt");
    const receipt = parse(readFileSync(approval(root), "utf8")) as { replaced: Record<string, string> };
    expect(Object.keys(receipt.replaced)).toContain(QUIT);
    expect(receipt.replaced[QUIT]).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("a node changed after the approval stops the archive, and nothing is written (EX-01m4at3x8bvsh0cfn5z5wvp380)", () => {
    const root = approved("stale-changed");
    // Another change lands on the same rule after this one was approved.
    const landed = readFileSync(quitRule(root), "utf8").replace("Every running game.", "Every running game, paused or not.");
    writeFileSync(quitRule(root), landed);

    const refused = json(root, ["archive", "add-pause"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors).toContainEqual(expect.objectContaining({ code: "ACCEPTED_CHANGED_SINCE_APPROVAL", message: expect.stringContaining("Quitting asks for confirmation") }));
    expect(readFileSync(quitRule(root), "utf8"), "the later text stays accepted").toBe(landed);
  });

  test("a node unchanged since the approval lands as before (EX-01m4at3xera2pxgcey1tvxmz88)", () => {
    const root = approved("stale-unchanged");
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect(archived.body.data.replaced.map((node: { id: string }) => node.id)).toContain(QUIT);
  });

  test("an approval without fingerprints is not archived over a replaced node; it is asked for again", () => {
    const root = approved("stale-old-receipt");
    const receipt = parse(readFileSync(approval(root), "utf8")) as Record<string, unknown>;
    delete receipt.replaced;
    writeFileSync(approval(root), stringify(receipt));

    const refused = json(root, ["archive", "add-pause"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors).toContainEqual(expect.objectContaining({ code: "APPROVAL_WITHOUT_BASES" }));

    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    expect(json(root, ["archive", "add-pause"]).status).toBe(0);
  });
});
