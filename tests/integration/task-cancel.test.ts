import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

const cli = resolve("dist/cli/index.js");

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function fail(repository: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
}

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" });
}

function newTask(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["task", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
}

/** A defined task, so a cancellation can be tested from every live state. */
function definedTask(repository: string, title: string): { id: string; path: string } {
  const task = newTask(repository, title);
  run(repository, ["task", "define", task.id, "--from", coveredDefinition(task.path, {
    outcome: "The outcome is observable.",
    acceptance: ["The condition is observable."],
    verification: "The condition is checked by reading it.",
  })]);
  return task;
}

function decision(repository: string, title: string): string {
  const source = join(repository, "decision.md");
  writeFileSync(source, `---\ntitle: ${title}\n---\n\n## Decision\n\n${title}.\n\n## Context\n\nThe question came up and was settled.\n\n## Consequences\n\nWork that assumes otherwise is retired.\n`);
  const created = (run(repository, ["decision", "create", "--from", source, "--approve"]) as { data: { id: string } }).data;
  unlinkSync(source);
  git(repository, "add", ".");
  git(repository, "commit", "-m", "record decision");
  return created.id;
}

function lifecycleEvents(repository: string, id: string): Array<Record<string, unknown>> {
  const directory = join(repository, ".kotta/process/events", id);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith(".json")).sort()
    .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")) as Record<string, unknown>);
}

function fixture(prefix: string): string {
  const repository = mkdtempSync(join(tmpdir(), prefix));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  git(repository, "add", ".");
  git(repository, "commit", "-m", "initial");
  run(repository, ["init"]);
  acceptFixtureSpec(repository);
  git(repository, "add", ".gitattributes", ".gitignore");
  git(repository, "commit", "-m", "initialize Kotta metadata");
  return repository;
}

describe("task cancel", () => {
  test("cancels a backlog task as duplicate into done and validates green", () => {
    const repository = fixture("kotta-cancel-backlog-");
    const original = newTask(repository, "Original work");
    const task = newTask(repository, "Duplicate work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");

    const cancelled = run(repository, ["task", "cancel", task.id, "--resolution", "duplicate", "--reason", "The same work is already captured", "--superseded-by", original.id, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, command: "task cancel", data: { id: task.id, resolution: "duplicate", supersededBy: original.id, claimReleased: false } });

    expect(existsSync(task.path)).toBe(true);
    const content = readFileSync(task.path, "utf8");
    expect(content).toContain("status: done");
    expect(content).toContain("resolution: duplicate");
    expect(content).toContain("cancellation_reason: The same work is already captured");
    expect(content).toContain(`superseded_by: ${original.id}`);
    expect(run(repository, ["task", "validate", task.id])).toMatchObject({ ok: true, data: { id: task.id, state: "done" } });
  });

  test("retires an active task superseded by a decision, releasing the claim and keeping the branch", () => {
    const repository = fixture("kotta-cancel-active-");
    const superseding = decision(repository, "Hungarian pages keep Hungarian slugs");
    const task = definedTask(repository, "Move the Hungarian routes to English slugs");
    run(repository, ["task", "start", task.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", task.id);
    writeFileSync(join(worktree, "route.md"), "# Route\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: start the move");
    const branch = readFileSync(task.path, "utf8").match(/^branch: (.+)$/m)?.[1] ?? "";

    const cancelled = run(repository, ["task", "cancel", task.id, "--resolution", "obsolete", "--reason", "A decision established the opposite", "--superseded-by", superseding, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, data: { resolution: "obsolete", supersededBy: superseding, claimReleased: true } });

    expect(readFileSync(task.path, "utf8")).toMatch(/^status: done$/m);
    expect(existsSync(join(repository, ".kotta/process/claims", `${task.id}.yaml`))).toBe(false);
    expect(existsSync(worktree)).toBe(false);
    // The branch is the only copy of whatever was built; close deletes a merged branch, cancel never can.
    expect(git(repository, "branch", "--list", branch).trim()).not.toBe("");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });

    const summary = String(lifecycleEvents(repository, task.id).filter((event) => event.kind === "lifecycle").at(-1)?.summary ?? "");
    expect(summary).toContain("from active");
    expect(summary).toContain("resolution obsolete");
    expect(summary).toContain("A decision established the opposite");
    expect(summary).toContain(superseding);
    expect(summary).toContain("claim was released");
    expect(lifecycleEvents(repository, task.id).some((event) => event.kind === "approval" && event.action === "task.cancel")).toBe(true);
  });

  test("retires a submitted task, the exit review did not have", () => {
    const repository = fixture("kotta-cancel-review-");
    const superseding = decision(repository, "The pipeline is replaced wholesale");
    const task = definedTask(repository, "Extend the deploy pipeline");
    run(repository, ["task", "start", task.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", task.id);
    writeFileSync(join(worktree, "pipeline.md"), "# Pipeline\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: extend the pipeline");
    run(worktree, ["task", "review", task.id, "--evidence", "The pipeline was extended and inspected"]);
    expect(readFileSync(task.path, "utf8")).toMatch(/^status: review$/m);

    const cancelled = run(repository, ["task", "cancel", task.id, "--resolution", "obsolete", "--reason", "The work was thrown away after submission", "--superseded-by", superseding, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, data: { resolution: "obsolete", claimReleased: true } });
    expect(readFileSync(task.path, "utf8")).toMatch(/^status: done$/m);
    expect(existsSync(join(repository, ".kotta/process/claims", `${task.id}.yaml`))).toBe(false);
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("refuses an active cancellation with uncommitted work and changes nothing", () => {
    const repository = fixture("kotta-cancel-dirty-");
    const task = definedTask(repository, "Half-written work");
    run(repository, ["task", "start", task.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", task.id);
    writeFileSync(join(worktree, "draft.md"), "unfinished\n");

    const refused = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("contains uncommitted changes");
    expect(existsSync(task.path)).toBe(true);
    expect(readFileSync(task.path, "utf8")).toMatch(/^status: active$/m);
    expect(existsSync(join(repository, ".kotta/process/claims", `${task.id}.yaml`))).toBe(true);
    expect(existsSync(worktree)).toBe(true);
    expect(existsSync(join(worktree, "draft.md"))).toBe(true);
  });

  test("retires an active task whose worktree has vanished", () => {
    const repository = fixture("kotta-cancel-missing-");
    const task = definedTask(repository, "Stranded work");
    run(repository, ["task", "start", task.id, "--agent", "codex"]);
    git(repository, "worktree", "remove", join(repository, ".worktrees", task.id));

    expect(run(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Recovered a stuck execution", "--approve"]))
      .toMatchObject({ ok: true, data: { claimReleased: true } });
    expect(existsSync(join(repository, ".kotta/process/claims", `${task.id}.yaml`))).toBe(false);
  });

  test("names the tasks that depended on the retired one without cancelling them", () => {
    const repository = fixture("kotta-cancel-dependents-");
    const foundation = newTask(repository, "Foundation");
    const dependent = newTask(repository, "Built on the foundation");
    writeFileSync(dependent.path, readFileSync(dependent.path, "utf8").replace("depends_on: []", `depends_on:\n  - ${foundation.id}`));
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture tasks");

    const cancelled = run(repository, ["task", "cancel", foundation.id, "--resolution", "cancelled", "--reason", "Not building this after all", "--approve"]);
    expect((cancelled as { data: { dependents: string[] } }).data.dependents).toEqual([dependent.id]);
    expect(existsSync(dependent.path)).toBe(true);
  });

  test("refuses a cancellation with no reason, no approval, or an unknown resolution", () => {
    const repository = fixture("kotta-cancel-refusals-");
    const task = newTask(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");

    const unapproved = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "No longer wanted"]);
    expect(unapproved.status).not.toBe(0);
    expect(unapproved.stdout).toContain("Human cancel approval is required");

    const unstated = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "   ", "--approve"]);
    expect(unstated.status).not.toBe(0);
    expect(unstated.stdout).toContain("requires --reason");

    const missingReason = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--approve"]);
    expect(missingReason.status).not.toBe(0);
    expect(missingReason.stderr).toContain("--reason");

    const unknown = fail(repository, ["task", "cancel", task.id, "--resolution", "wontfix", "--reason", "Anything", "--approve"]);
    expect(unknown.status).not.toBe(0);
    expect(unknown.stdout).toContain("Cancel resolution must be one of");

    expect(existsSync(task.path)).toBe(true);
    expect(readFileSync(task.path, "utf8")).not.toMatch(/^status: done$/m);
  });

  test("refuses a supersession that is unnamed, dangling, or circular", () => {
    const repository = fixture("kotta-cancel-superseded-");
    const task = newTask(repository, "Superseded work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");

    const unnamed = fail(repository, ["task", "cancel", task.id, "--resolution", "obsolete", "--reason", "Something replaced it", "--approve"]);
    expect(unnamed.status).not.toBe(0);
    expect(unnamed.stdout).toContain("--superseded-by");

    const dangling = fail(repository, ["task", "cancel", task.id, "--resolution", "obsolete", "--reason", "Something replaced it", "--superseded-by", "D-404", "--approve"]);
    expect(dangling.status).not.toBe(0);
    expect(dangling.stdout).toContain("names no task or decision");

    const circular = fail(repository, ["task", "cancel", task.id, "--resolution", "duplicate", "--reason", "Itself", "--superseded-by", task.id, "--approve"]);
    expect(circular.status).not.toBe(0);
    expect(circular.stdout).toContain("cannot supersede itself");

    expect(existsSync(task.path)).toBe(true);
  });

  test("refuses a second cancellation of a task already retired", () => {
    const repository = fixture("kotta-cancel-twice-");
    const task = newTask(repository, "Retired once");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");
    run(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);

    const refused = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Abandoned again", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("already done");
    expect(refused.stdout).toContain("reopen");
  });

  test("a decision shows the tasks it retired", () => {
    const repository = fixture("kotta-cancel-decision-view-");
    const superseding = decision(repository, "Slugs stay as they are");
    const task = newTask(repository, "Rewrite the slugs");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");
    run(repository, ["task", "cancel", task.id, "--resolution", "obsolete", "--reason", "The decision settled the opposite", "--superseded-by", superseding, "--approve"]);

    const shown = run(repository, ["decision", "show", superseding]) as { data: { superseded: Array<{ id: string; title: string }> } };
    expect(shown.data.superseded).toEqual([{ id: task.id, title: "Rewrite the slugs" }]);
  });

  test("does not require review evidence for a cancelled done task but still requires it for completed", () => {
    const repository = fixture("kotta-cancel-evidence-");
    const task = newTask(repository, "Cancelled path");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");
    run(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    const cancelledPath = task.path;
    expect(readFileSync(cancelledPath, "utf8")).not.toContain("## Review evidence");
    expect(run(repository, ["task", "validate", task.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // A hand-written sequential task must stay resolvable next to the minted one (D-010).
    const completed = readFileSync(cancelledPath, "utf8")
      .replace(`id: ${task.id}`, "id: T-901")
      .replace("resolution: cancelled", "resolution: completed")
      .replace(`# ${task.id}`, "# T-901");
    writeFileSync(join(repository, ".kotta/process/tasks/T-901-completed-path.md"), completed);
    const report = fail(repository, ["task", "validate", "T-901"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("MISSING_REVIEW_EVIDENCE");
  });
});
