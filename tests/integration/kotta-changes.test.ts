import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PAUSE, answerPause, json, node, planningWorkspace, run, setNarrative, write } from "./planning-fixture.js";

/**
 * A change is Kotta's own: it opens under `.kotta/changes/`, whether or not the project uses
 * OpenSpec, and OpenSpec is an optional narrative beside the model (`narrative: none`, the default,
 * writes and checks nothing under `openspec/`). `kotta migrate` takes the changes an earlier release
 * kept in OpenSpec's folder into the workspace, and keeps a project's OpenSpec narrative where it had one.
 */

function workspace(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-changes-${label}-`));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  run(root, ["init", "--json"]);
  return root;
}

describe("kotta change", () => {
  // A request for a spec opens a change, not a document (BR-01m40e0afjevd5jy04135bh7fj, EX-01m40e0b1b9rpw2jwr2864xt82).
  test("new opens the change inside the workspace with a proposal to write, and nothing under openspec/", () => {
    const root = workspace("new");
    const opened = json(root, ["change", "new", "per-turn-model", "--title", "Choose the model per turn"]);
    expect(opened.status).toBe(0);
    expect(opened.body.data).toEqual({ change: "per-turn-model", directory: ".kotta/changes/per-turn-model", proposal: ".kotta/changes/per-turn-model/proposal.md" });
    const proposal = readFileSync(join(root, ".kotta/changes/per-turn-model/proposal.md"), "utf8");
    expect(proposal).toMatch(/^# Choose the model per turn\n/);
    expect(proposal).toContain("## Why");
    expect(proposal).toContain("## Open decisions");
    expect(existsSync(join(root, ".kotta/changes/per-turn-model/model"))).toBe(true);
    expect(existsSync(join(root, "openspec"))).toBe(false);

    expect(run(root, ["change", "new", "per-turn-model"]).status).toBe(1);
    expect(run(root, ["change", "new", "Not A Name"]).status).toBe(1);
    expect(json(root, ["change", "list"]).body.data).toEqual({ folder: ".kotta/changes", changes: ["per-turn-model"], stranded: [] });
  });

  test("a change left in OpenSpec's folder is named with the move that fixes it", () => {
    const root = workspace("stranded");
    write(root, "openspec/changes/old/proposal.md", "# Old\n");
    write(root, "openspec/changes/old/model/REMOVED.md", "\n");
    const refused = run(root, ["plan", "old"]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain("git mv openspec/changes/old .kotta/changes/old");
    expect(json(root, ["change", "list"]).body.data.stranded).toEqual(["old"]);
    const validated = json(root, ["validate"]);
    expect((validated.body as unknown as { warnings: Array<{ code: string }> }).warnings).toContainEqual(expect.objectContaining({ code: "CHANGE_STRANDED" }));
  });
});

describe("narrative: none, the default", () => {
  // Without a narrative setting nothing is written under openspec (BR-01m40e0ankvnv82me5emp1hf25, EX-01m40e0bcp9ebc3tf7f0xegwk8).
  test("archive lands the model and writes nothing under openspec/", () => {
    const root = planningWorkspace("none", null);
    answerPause(root);
    expect(run(root, ["plan", "add-pause"]).status).toBe(0);
    expect(run(root, ["approve", "add-pause", "--by", "Ada"]).status).toBe(0);
    const archived = json(root, ["archive", "add-pause"]);
    expect(archived.status).toBe(0);
    expect(archived.body.data).toMatchObject({ narrative: "none", narratives: [], drift: [] });
    expect(archived.body.data.archivedTo).toMatch(/^\.kotta\/changes\/archive\/\d{4}-\d{2}-\d{2}-add-pause$/);
    expect(existsSync(join(root, "openspec"))).toBe(false);
    expect(run(root, ["archive", "add-pause"]).stderr).toContain("kotta change new add-pause");
  });

  test("an obligation needs no SHALL or MUST, and the scaffold does not ask for one", () => {
    const root = planningWorkspace("none-keyword", null);
    answerPause(root);
    write(root, `.kotta/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, node(
      { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", capability: "game/session", provenance: { level: "stated", decided_by: "human", sources: [".kotta/changes/add-pause/proposal.md · Why"] } },
      { Rule: "Szünet alatt az óra nem jár.", Rationale: "A pause is not play.", Scope: "Timed games.", "Open decisions": "None." }));
    expect(json(root, ["validate"]).body.ok).toBe(true);
    expect(json(root, ["plan", "add-pause"]).status).toBe(0);
    const drafted = json(root, ["spec", "new", "business-rule", "--title", "Scores are kept", "--into", "add-pause"]);
    expect(drafted.body.data.normative).toEqual([]);
    expect(readFileSync(join(root, drafted.body.data.path), "utf8")).not.toContain("SHALL");
  });

  test("OpenSpec specs with no setting are named, so the project decides whether to keep them", () => {
    const root = workspace("unset");
    write(root, "openspec/specs/game/spec.md", "# game Specification\n\n## Purpose\n\nPlay.\n");
    const validated = json(root, ["validate"]);
    expect((validated.body as unknown as { warnings: Array<{ code: string; message: string }> }).warnings).toContainEqual(expect.objectContaining({ code: "NARRATIVE_UNSET", message: expect.stringContaining("narrative: generated") }));
    setNarrative(root, "generated");
    expect((json(root, ["validate"]).body as unknown as { warnings: Array<{ code: string }> }).warnings.map((warning) => warning.code)).not.toContain("NARRATIVE_UNSET");
  });
});

describe("kotta migrate takes the changes out of OpenSpec's folder", () => {
  function earlier(label: string): string {
    const root = workspace(label);
    // An open change, with provenance naming its old folder.
    write(root, "openspec/changes/add-pause/proposal.md", "# Add pause\n\n## Why\n\nPlayers step away.\n");
    write(root, `openspec/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, node(
      { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", provenance: { level: "stated", decided_by: "human", sources: ["openspec/changes/add-pause/proposal.md · Why"] } },
      { Rule: "The clock SHALL NOT advance while paused.", Rationale: "A pause is not play.", Scope: "Timed games." }));
    // An OpenSpec proposal with no model yet, a landed Kotta change, and OpenSpec's own history.
    write(root, "openspec/changes/per-turn-model/proposal.md", "# Per-turn model\n");
    write(root, "openspec/changes/archive/2026-09-20-landed/approval.yaml", "approved_by: Ada\n");
    write(root, "openspec/changes/archive/2026-01-01-openspec-only/proposal.md", "# History\n");
    write(root, "openspec/specs/game/spec.md", "# game Specification\n\n## Purpose\n\nPlay.\n");
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "earlier"], { cwd: root });
    return root;
  }

  test("the dry run names every move and writes nothing", () => {
    const root = earlier("dry");
    const planned = run(root, ["migrate", "--dry-run"]);
    expect(planned.status).toBe(0);
    expect(planned.stdout).toContain("move       openspec/changes/add-pause → .kotta/changes/add-pause");
    expect(planned.stdout).toContain("move       openspec/changes/per-turn-model → .kotta/changes/per-turn-model");
    expect(planned.stdout).toContain("move       openspec/changes/archive/2026-09-20-landed → .kotta/changes/archive/2026-09-20-landed");
    expect(planned.stdout).not.toContain("openspec-only");
    expect(planned.stdout).toContain("narrative: generated");
    expect(existsSync(join(root, ".kotta/changes"))).toBe(false);
  });

  // A change left in OpenSpec's folder moves into the workspace (EX-01m40e0bs4dbanbw4ypr86pf0x).
  test("moves the changes, rewrites the provenance of an unapproved one, keeps the OpenSpec narrative, and is then current", () => {
    const root = earlier("apply");
    expect(run(root, ["migrate"]).status).toBe(0);
    expect(readdirSync(join(root, ".kotta/changes")).sort()).toEqual(["add-pause", "archive", "per-turn-model"]);
    expect(readdirSync(join(root, ".kotta/changes/archive"))).toEqual(["2026-09-20-landed"]);
    expect(readdirSync(join(root, "openspec/changes"))).toEqual(["archive"]);
    expect(readdirSync(join(root, "openspec/changes/archive"))).toEqual(["2026-01-01-openspec-only"]);
    const rule = readFileSync(join(root, `.kotta/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`), "utf8");
    expect(rule).toContain(".kotta/changes/add-pause/proposal.md · Why");
    expect(rule).not.toContain("openspec/changes");
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("narrative: generated");
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })).toContain("R  openspec/changes/add-pause/proposal.md -> .kotta/changes/add-pause/proposal.md");
    expect(run(root, ["migrate"]).stdout).toContain("nothing to migrate");
  });

  test("an approved change moves byte-identical, and the report says why", () => {
    const root = earlier("approved");
    write(root, "openspec/changes/add-pause/approval.yaml", "approved_by: Ada\n");
    const before = readFileSync(join(root, `openspec/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`), "utf8");
    const migrated = run(root, ["migrate"]);
    expect(migrated.stdout).toContain("add-pause is approved, so its model was moved byte-identical");
    expect(readFileSync(join(root, `.kotta/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`), "utf8")).toBe(before);
  });

  test("a project without OpenSpec specs gets no narrative setting", () => {
    const root = workspace("plain");
    write(root, "openspec/changes/per-turn-model/proposal.md", "# Per-turn model\n");
    expect(run(root, ["migrate"]).status).toBe(0);
    expect(existsSync(join(root, ".kotta/changes/per-turn-model/proposal.md"))).toBe(true);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).not.toContain("narrative");
  });
});
