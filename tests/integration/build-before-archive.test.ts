import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { id, json, node, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * A change is built before it is archived (BR-01m3w9ajdxbf04ph4y97dmry35): the approved change
 * stays open on a working branch, `kotta gap` measures it there, and `kotta archive` closes it
 * once every node of its delta is kept or admitted.
 */

const CHANGE = ".kotta/changes/per-turn";
const RULE = id("BR", "b9");
const KEPT = id("EX", "e91");
const UNBUILT = id("EX", "e92");

const git = (root: string, ...args: string[]) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
const commit = (root: string, message: string) => { git(root, "add", "-A"); git(root, "commit", "-q", "-m", message); };
const stated = { level: "stated", decided_by: "human", sources: [`${CHANGE}/proposal.md · Why`], quote: "one move per turn — operator, 2026-10-02 09:00" };
const rulePath = `${CHANGE}/model/business-rules/one-move-per-turn-${RULE.slice(-8)}.md`;

/**
 * The accepted specification committed on main; on the branch `work`, an approved change of three
 * nodes and a test that names one of them. The fixture's own `add-pause` change is left unapproved.
 */
function workspace(label: string): string {
  const root = planningWorkspace(label, null);
  commit(root, "the accepted specification");
  git(root, "switch", "-q", "-c", "work");
  write(root, `${CHANGE}/proposal.md`, "# One move per turn\n\n## Why\n\nA turn is one move.\n");
  write(root, rulePath, node(
    { id: RULE, form: "business-rule", overall: true, title: "A turn is one move", provenance: stated },
    { Rule: "The game SHALL take one move per turn.", Rationale: "Two moves is two turns.", Scope: "Every game." }));
  write(root, `${CHANGE}/model/examples/a-move-ends-the-turn-${KEPT.slice(-8)}.md`, node(
    { id: KEPT, form: "example", title: "A move ends the turn", subjects: [RULE], provenance: stated },
    { Given: "a player to move", When: "the player moves", Then: "the turn passes" }));
  write(root, `${CHANGE}/model/examples/a-second-move-is-refused-${UNBUILT.slice(-8)}.md`, node(
    { id: UNBUILT, form: "example", title: "A second move is refused", subjects: [RULE], provenance: stated },
    { Given: "a player who has moved", When: "the player moves again", Then: "the move is refused" }));
  const planned = run(root, ["plan", "per-turn"]);
  expect(planned.status, planned.stdout + planned.stderr).toBe(0);
  expect(run(root, ["approve", "per-turn", "--by", "Ada"]).status).toBe(0);
  write(root, "tests/turn.test.ts", `// ${KEPT}\ntest("a move ends the turn", () => {});\n`);
  commit(root, "the approved change, and the first of its code");
  return root;
}

describe("kotta gap measures an approved open change (UC-01m0fpqfxjvet99wbz0v1ag64q, BR-01m0qtshfqhcrrqtz051zm9svr)", () => {
  test("unasked, in a section of its own, read from the checked-out commit, and without refusing over it (EX-01m3w9ajt2zqpc5gc0katqef96)", () => {
    const root = workspace("gap-open-change");
    const report = json(root, ["gap"]);
    const [change] = report.body.data.changes;
    expect(report.body.data.changes).toHaveLength(1);
    expect(change).toMatchObject({ change: "per-turn", approvedBy: "Ada", branch: "work" });
    expect(change.commit).toBe(git(root, "rev-parse", "HEAD").trim());
    expect(report.body.data.commit, "the accepted model is still read from the base branch").toBe(git(root, "rev-parse", "main").trim());
    expect(change.remaining.map((entry: { id: string }) => entry.id).sort()).toEqual([UNBUILT, RULE].sort());
    expect(change.nodes.find((entry: { id: string }) => entry.id === KEPT)).toMatchObject({ delta: "added", evidence: [{ kind: "test", path: "tests/turn.test.ts" }] });
    // The change's own model/ names every one of its ids, and counts for nothing.
    expect(change.nodes.find((entry: { id: string }) => entry.id === RULE).evidence).toEqual([]);
    // Counted apart: no refusal names a node of the open change.
    expect((report.body.errors ?? []).filter((error) => error.path?.includes("/changes/"))).toEqual([]);
    expect(report.body.data.promises.map((entry: { id: string }) => entry.id)).not.toContain(RULE);
    // A change nobody approved promises nothing yet; the report says it was not measured.
    expect(report.body.data.unmeasuredChanges).toEqual([{ change: "add-pause", reason: "never approved" }]);

    const text = run(root, ["gap"]).stdout;
    expect(text).toContain("Open changes: per-turn (2 of 3 without evidence) · not measured: add-pause (never approved)");
    expect(text).toContain("## Open change: per-turn");
    expect(text).toContain("### The work that remains\n- A second move is refused");
    expect(text).toContain("### Evidenced\n- A move ends the turn");
  });

  test("--change narrows the report to one change, exits 0 over its unbuilt promises, and refuses a change it cannot measure", () => {
    const root = workspace("gap-one-change");
    const narrowed = run(root, ["gap", "--change", "per-turn"]);
    expect(narrowed.status, "an unbuilt promise of an open change is work, not a refusal").toBe(0);
    expect(narrowed.stdout).toContain("Change: per-turn");
    expect(narrowed.stdout).toContain("Promises: 3 · evidenced 1 · admitted 0 · without evidence 2");
    expect(narrowed.stdout).not.toContain("Enforced behavior");

    const unapproved = run(root, ["gap", "--change", "add-pause"]);
    expect(unapproved.status).not.toBe(0);
    expect(unapproved.stderr).toContain("never approved");

    // A delta edited after the yes is no longer what was agreed, so it is not measured either.
    writeFileSync(join(root, rulePath), readFileSync(join(root, rulePath), "utf8").replace("one move per turn", "two moves per turn"));
    commit(root, "the rule, edited after the yes");
    expect(json(root, ["gap"]).body.data.unmeasuredChanges).toContainEqual({ change: "per-turn", reason: "its delta changed after the approval" });

    // On the base branch the change does not exist yet, and neither does its section.
    git(root, "switch", "-q", "main");
    expect(json(root, ["gap"]).body.data.changes).toEqual([]);
  });
});

describe("kotta archive closes a built change (BR-01m3w9ajdxbf04ph4y97dmry35)", () => {
  test("refuses a node that is neither kept nor admitted, writes nothing, and lands once each is accounted for (EX-01m3wa6fbrg18wtsvfrdab0wn9)", () => {
    const root = workspace("archive-unaccounted");
    const refused = json(root, ["archive", "per-turn"]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors?.map((error) => error.code)).toEqual(["UNACCOUNTED_PROMISE", "UNACCOUNTED_PROMISE"]);
    const messages = refused.body.errors!.map((error) => error.message).join("\n");
    expect(messages).toContain("A turn is one move (business-rule) is neither kept nor admitted");
    expect(messages).toContain("A second move is refused (example)");
    expect(messages, "it says where it looked").toContain("nothing on work@");
    expect(existsSync(join(root, CHANGE)), "nothing was moved").toBe(true);
    expect(existsSync(join(root, `.kotta/spec/business-rules/one-move-per-turn-${RULE.slice(-8)}.md`)), "nothing was merged").toBe(false);
    expect(git(root, "status", "--porcelain"), "nothing was written").toBe("");

    // One node is admitted — after the yes, which the approval survives — and the other is built.
    writeFileSync(join(root, rulePath), readFileSync(join(root, rulePath), "utf8").replace(/^---\n/, '---\naccepted:\n  - "unimplemented: the turn counter is the next change"\n'));
    write(root, "src/turn.ts", `// ${UNBUILT}\nexport const refuseSecondMove = true;\n`);
    expect(json(root, ["archive", "per-turn"]).body.errors?.map((error) => error.code), "written but not committed is not there yet").toEqual(["UNACCOUNTED_PROMISE"]);
    commit(root, "the second move is refused");

    const archived = json(root, ["archive", "per-turn"]);
    expect(archived.status, JSON.stringify(archived.body.errors)).toBe(0);
    expect(archived.body.data.added.map((entry: { id: string }) => entry.id).sort()).toEqual([RULE, KEPT, UNBUILT].sort());
    expect(existsSync(join(root, CHANGE))).toBe(false);
  });
});
