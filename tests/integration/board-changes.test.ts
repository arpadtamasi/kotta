import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";
import { mergeChange, readBoard, type Workspace } from "../../ui/src/App";
import { GAME, HOLD, PAUSE, PROMPT, QUIT, answerPause, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * The board shows what waits at the gate (BR-01m40e522gtq49knhy51hr9e3d): every open change, read
 * from the working tree, as the model would be after it, with what it adds, changes or removes
 * marked — and the accepted view untouched.
 */

describe("an open change on the board", () => {
  test("an uncommitted change appears, marked, with its proposal, open decisions and state (EX-01m40e5289ztd19t2he1g3vw2b)", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-board-change-"));
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
    run(root, ["init", "--json"]);
    run(root, ["change", "new", "elso-szelet", "--title", "Első szelet", "--json"]);
    const drafted = JSON.parse(run(root, ["spec", "new", "goal", "--title", "Players finish games", "--into", "elso-szelet", "--json"]).stdout) as { data: { id: string } };

    const workspace = readWorkspace(root);
    expect(workspace.spec).toEqual([]);
    expect(workspace.changes).toHaveLength(1);
    const [change] = workspace.changes;
    expect(change).toMatchObject({ name: "elso-szelet", title: "Első szelet", removed: [], planned: false, approved: false });
    expect(change.proposal).toContain("## Why");
    expect(change.nodes.map((node) => [node.id, node.mark])).toEqual([[drafted.data.id, "added"]]);
    expect(change.uncommitted.some((path) => path.startsWith(".kotta/changes/elso-szelet/"))).toBe(true);

    const board = readBoard(workspace as unknown as Workspace, "elso-szelet");
    expect(board.spec.map((node) => [node.title, node.mark, node.uncommitted])).toEqual([["Players finish games", "added", true]]);
  });

  test("a planned and approved change says so", () => {
    const root = planningWorkspace("board-approved", null);
    answerPause(root);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(readWorkspace(root).changes[0]).toMatchObject({ name: "add-pause", planned: true, approved: false, openDecisions: [] });
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    const approved = readWorkspace(root).changes[0];
    expect(approved).toMatchObject({ planned: true, approved: true });
    // What the yes covered: who and when from the receipt, the gate's own list as the report put it (BR-01m4gh4rxe5navrnzfz0t5a2jf).
    expect(approved.approval?.by).toBe("Ada");
    expect(approved.approval?.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(approved.approval?.agentDecidedAtGate.some((line) => line.includes("Game lifecycle"))).toBe(true);
  });

  test("an accepted node names the change that landed it, who approved it and when (EX-01m4gh4s32tcgq6yj2zm5ynnr7)", () => {
    const root = planningWorkspace("board-landed", null);
    answerPause(root);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    expect(run(root, ["archive", "add-pause"]).status).toBe(0);
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", "add", "-A"], { cwd: root });
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", "commit", "-qm", "the archived change"], { cwd: root });
    const workspace = readWorkspace(root);
    expect(workspace.landings).toHaveLength(1);
    expect(workspace.landings[0]).toMatchObject({ change: "add-pause", by: "Ada" });
    expect(workspace.landings[0].nodes).toContain(PAUSE);
    const board = readBoard(workspace as unknown as Workspace);
    expect(board.landedBy.get(PAUSE)?.by).toBe("Ada");
    expect(board.landedBy.get(GAME)).toBeUndefined();
  });

  test("a changed node is marked against the accepted one, a removed one is marked, the rest is not (EX-01m40e52dx6qscs9cevrp7zcfh)", () => {
    const root = planningWorkspace("board-marks", null);
    write(root, ".kotta/changes/add-pause/model/REMOVED.md", `- ${PROMPT} — the prompt no longer appears for a paused game\n`);
    const workspace = readWorkspace(root) as unknown as Workspace;
    const change = workspace.changes![0];
    expect(change.openDecisions.map((decision) => decision.node)).toContain(PAUSE);

    const merged = mergeChange(workspace.spec!, change);
    const byId = new Map(merged.map((node) => [node.id, node]));
    expect(byId.get(QUIT)?.mark).toBe("changed");
    expect(byId.get(QUIT)?.before?.rule).not.toBe(byId.get(QUIT)?.sections.rule);
    expect(byId.get(PROMPT)?.mark).toBe("removed");
    expect(byId.get(PAUSE)?.mark).toBe("added");
    expect(byId.get(HOLD)?.mark).toBe("added");
    expect(byId.get(GAME)?.mark).toBeUndefined();
  });

  test("the accepted view is unchanged by an open change (EX-01m40e52kbj64sykakqvez2bpz)", () => {
    const root = planningWorkspace("board-accepted", null);
    const workspace = readWorkspace(root) as unknown as Workspace;
    const accepted = readBoard(workspace);
    expect(accepted.change).toBeNull();
    expect(accepted.spec.every((node) => node.mark === undefined)).toBe(true);
    expect(accepted.spec.map((node) => node.id)).not.toContain(PAUSE);
    expect(accepted.spec.find((node) => node.id === QUIT)?.sections).toEqual(workspace.spec!.find((node) => node.id === QUIT)?.sections);
  });
});
