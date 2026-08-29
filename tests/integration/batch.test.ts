import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

/** Kotta commits the canonical state it writes (BR-01m0f0wn89r5np2yce79y2pctq), so a fixture
 *  commits only what it changed itself — and an empty commit would fail. */
function commitIfDirty(root: string, message: string): void {
  git(root, "add", "-A");
  if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", message);
}

describe("dependency-aware batch", () => {
  test("creates a backlog batch and keeps task membership in sync", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-batch-membership-"));
    git(root, "init", "-b", "main");
    // Kotta commits the canonical state it writes, so a fixture needs an identity to commit with.
    // Without one this passes on any machine that has a global git identity and fails on a clean
    // runner — which is where it failed, silently, for a day and a half.
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    acceptFixtureSpec(root);
    const batch = (run(root, ["batch", "new", "--title", "Launch batch", "--goal", "Ship the first slice", "--parallelism", "1"]) as { ok: boolean; data: { id: string; path: string } });
    expect(batch.ok).toBe(true);
    expect(batch.data.id).toMatch(/^P-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(batch.data.path)).toBe(`launch-batch-${batch.data.id.slice(-8)}.md`);
    const batchFile = readFileSync(batch.data.path, "utf8");
    expect(batchFile).toContain("parallelism: 1");
    expect(batchFile).toContain("create_observations: true");
    const task = (run(root, ["task", "new", "--title", "Prepare release", "--type", "feature"]) as { data: { id: string; path: string } }).data;
    expect(run(root, ["batch", "add", batch.data.id, task.id])).toMatchObject({ ok: true, data: { tasks: [task.id] } });
    expect(readFileSync(task.path, "utf8")).toContain(`batch: ${batch.data.id}`);
    expect(run(root, ["batch", "remove", batch.data.id, task.id])).toMatchObject({ ok: true, data: { tasks: [] } });
    expect(readFileSync(task.path, "utf8")).toContain("batch: null");
  });

  test("plans all dependency layers and starts only currently executable tasks", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-batch-"));
    git(root, "init", "-b", "main"); git(root, "config", "user.name", "Kotta Test"); git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    acceptFixtureSpec(root);
    const tasks: Array<{ id: string; filename: string }> = [];
    for (const title of ["Build parser", "Expose command"]) {
      const created = run(root, ["task", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
      const path = created.data.path;
      run(root, ["task", "define", created.data.id, "--from", coveredDefinition(path, { outcome: `${title} works.`, acceptance: [`${title} is observable.`], verification: "Run integration tests." })]);
      tasks.push({ id: created.data.id, filename: basename(path) });
    }
    const [parser, command] = tasks;
    const second = join(root, ".kotta/process/tasks", command.filename);
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", `depends_on:\n  - ${parser.id}`));
    const batchId = (run(root, ["batch", "new", "--title", "Parser slice", "--goal", "Deliver a parser slice"]) as { data: { id: string } }).data.id;
    run(root, ["batch", "add", batchId, parser.id]);
    run(root, ["batch", "add", batchId, command.id]);
    writeFileSync(second, readFileSync(second, "utf8").replace("status: defined", "status: backlog"));
    expect(run(root, ["batch", "validate", batchId])).toMatchObject({ ok: true, command: "batch validate" });
    git(root, "add", "."); commitIfDirty(root, "define batch");

    expect(run(root, ["batch", "validate", batchId])).toMatchObject({ ok: true, data: { waves: [[parser.id], [command.id]] } });
    expect(run(root, ["batch", "start", batchId, "--agent", "codex"])).toMatchObject({ ok: true, data: { started: [parser.id], waiting: [command.id] } });
    expect(existsSync(join(root, ".kotta/process/claims", `${parser.id}.yaml`))).toBe(true);
    expect(existsSync(join(root, ".worktrees", command.id))).toBe(false);
    expect(run(root, ["batch", "status", batchId])).toMatchObject({
      ok: true,
      data: { status: "active", tasks: [{ id: parser.id, state: "active", worktree: expect.stringContaining(`.worktrees/${parser.id}`) }, { id: command.id, state: "backlog" }] },
    });
    const workspace = readWorkspace(root);
    expect(workspace.tasks.filter((task) => task.id === parser.id)).toEqual([
      expect.objectContaining({ id: parser.id, status: "active", branch: `feat/${parser.id}-build-parser`, assigned_agent: "codex" }),
    ]);
  });
});

/** An initialized repository with one commit, defined for batch work. */
function workspaceRepository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-batch-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  acceptFixtureSpec(root);
  return root;
}

function definedTask(root: string, title: string) {
  const created = run(root, ["task", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
  const { id, path } = created.data;
  run(root, ["task", "define", id, "--from", coveredDefinition(path, { outcome: `${title} works.`, acceptance: [`${title} is observable.`], verification: "Run integration tests." })]);
  return { id, filename: basename(path) };
}

/** Everything a refusal must leave untouched. */
const snapshot = (root: string) => ({
  status: git(root, "status", "--porcelain"),
  head: git(root, "rev-parse", "HEAD"),
  workspace: git(root, "ls-files", ".kotta"),
});

const batchFile = (root: string, filename: string) => join(root, ".kotta/process/batches", filename);

/** The lifecycle state, read straight off a stored entity's frontmatter. */
const status = (path: string) => readFileSync(path, "utf8").match(/^status: (.+)$/m)?.[1];

/**
 * The P-005 shape: a batch still in `backlog` whose tasks reached done outside the batch
 * flow. Membership is recorded after the fact, exactly as it is for a batch nobody ever started.
 */
function backlogBatchWithMembers(label: string, members: Array<"done" | "defined">) {
  const root = workspaceRepository(label);
  const tasks = members.map((_member, index) => definedTask(root, `Slice ${index + 1}`));
  git(root, "add", ".");
  git(root, "commit", "-m", "define tasks");
  // `task cancel` is a supported writer into `done`; it needs a clean tree and commits itself.
  members.forEach((member, index) => {
    if (member === "done") run(root, ["task", "cancel", tasks[index].id, "--resolution", "cancelled", "--reason", "Retired to place a done member in the batch", "--approve"]);
  });
  const created = run(root, ["batch", "new", "--title", `Batch ${label}`, "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
  for (const task of tasks) run(root, ["batch", "add", created.data.id, task.id]);
  git(root, "add", ".");
  commitIfDirty(root, "define batch");
  return { root, batchId: created.data.id, filename: basename(created.data.path), tasks };
}

describe("batch close", () => {
  test("closes a backlog batch whose member tasks are all done", () => {
    const { root, batchId, filename, tasks } = backlogBatchWithMembers("closeable", ["done", "done"]);
    const tasksBefore = tasks.map((task) => readFileSync(join(root, ".kotta/process/tasks", task.filename), "utf8"));

    const closed = run(root, ["batch", "close", batchId, "--approve"]);
    expect(closed).toMatchObject({ ok: true, command: "batch close", data: { id: batchId, status: "done", changed: true } });
    // The record stays at its stable path; only its status changed.
    expect(existsSync(batchFile(root, filename))).toBe(true);
    expect(status(batchFile(root, filename))).toBe("done");
    expect(run(root, ["batch", "status", batchId])).toMatchObject({ ok: true, data: { id: batchId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    // Closing a batch never touches its tasks.
    expect(tasks.map((task) => readFileSync(join(root, ".kotta/process/tasks", task.filename), "utf8"))).toEqual(tasksBefore);
    expect(git(root, "status", "--porcelain")).toBe("");

    // Re-closing a finished batch is a no-op rather than an error.
    const before = snapshot(root);
    expect(run(root, ["batch", "close", batchId, "--approve"])).toMatchObject({ ok: true, data: { status: "done", changed: false } });
    expect(snapshot(root)).toEqual(before);
  });

  test("refuses a batch with a non-terminal member, names it, and changes nothing", () => {
    const { root, batchId, filename, tasks } = backlogBatchWithMembers("mixed", ["done", "defined"]);
    const before = snapshot(root);
    const batchBefore = readFileSync(batchFile(root, filename), "utf8");

    const refusal = attempt(root, ["batch", "close", batchId, "--approve"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`${tasks[1].id} is defined`);
    expect(snapshot(root)).toEqual(before);
    expect(readFileSync(batchFile(root, filename), "utf8")).toBe(batchBefore);
    expect(status(batchFile(root, filename))).toBe("backlog");
    expect(status(join(root, ".kotta/process/tasks", tasks[1].filename))).toBe("defined");
  });

  test("requires human approval", () => {
    const { root, batchId, filename } = backlogBatchWithMembers("approval", ["done"]);
    const before = snapshot(root);

    const refusal = attempt(root, ["batch", "close", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("Human close approval is required");
    expect(snapshot(root)).toEqual(before);
    expect(status(batchFile(root, filename))).toBe("backlog");
  });

  test("closing the last task completes a batch that never went active", () => {
    const root = workspaceRepository("autocomplete");
    const task = definedTask(root, "Only slice");
    const created = run(root, ["batch", "new", "--title", "Never started", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    const batchId = created.data.id;
    const filename = basename(created.data.path);
    run(root, ["batch", "add", batchId, task.id]);
    git(root, "add", ".");
    commitIfDirty(root, "define batch");

    const branch = (run(root, ["task", "start", task.id, "--agent", "codex"]) as { data: { branch: string } }).data.branch;
    const worktree = join(root, ".worktrees", task.id);
    writeFileSync(join(worktree, `${task.id}.md`), `# ${task.id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${task.id}`);
    run(worktree, ["task", "review", task.id, "--evidence", "verified", "--deviations", "None."]);
    git(root, "merge", "--no-ff", branch, "-m", `merge ${task.id}`);
    // The batch was never started; completion used to consider active batches only.
    expect(status(batchFile(root, filename))).toBe("backlog");

    run(root, ["task", "close", task.id, "--approve"]);
    expect(status(batchFile(root, filename))).toBe("done");
    expect(run(root, ["batch", "status", batchId])).toMatchObject({ ok: true, data: { id: batchId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(git(root, "status", "--porcelain")).toBe("");
  });
});

/**
 * A rendering never claims more than the result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb), and
 * `batch start` once ended with `No tasks were dispatched; every member is done.` — a line no
 * result reaching it can support. Completing the last member completes the batch
 * (UC-01m0f0wn89jebbfp6rjr0fxqh1), and a completed batch is refused before any report exists. The
 * only way to observe that line was to write a stored status by hand, which the rules forbid; so
 * this states positively what the supported commands do instead.
 */
describe("a batch whose last member finished", () => {
  test("completes, and starting it again is refused by name rather than reported as an empty dispatch", () => {
    const root = workspaceRepository("last-member");
    const task = definedTask(root, "Only slice");
    const created = run(root, ["batch", "new", "--title", "One member", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    const batchId = created.data.id;
    const filename = basename(created.data.path);
    run(root, ["batch", "add", batchId, task.id]);
    commitIfDirty(root, "define batch");

    const dispatch = run(root, ["batch", "start", batchId, "--agent", "codex"]) as { data: { started: string[] } };
    expect(dispatch.data.started).toEqual([task.id]);
    expect(status(batchFile(root, filename))).toBe("active");

    const branch = `feat/${task.id}-only-slice`;
    const worktree = join(root, ".worktrees", task.id);
    writeFileSync(join(worktree, `${task.id}.md`), `# ${task.id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${task.id}`);
    run(worktree, ["task", "review", task.id, "--evidence", "verified", "--deviations", "None."]);
    // A batch member integrates into its coordinator, not into the base branch.
    const coordinator = join(root, ".worktrees/batches", batchId);
    git(coordinator, "merge", "--no-ff", branch, "-m", `merge ${task.id}`);
    run(root, ["task", "close", task.id, "--approve"]);

    // The state the removed line described does not exist: the batch is already done here.
    expect(status(batchFile(root, filename))).toBe("done");

    const refusal = attempt(root, ["batch", "start", batchId, "--agent", "codex"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("must be defined or active");
    expect(refusal.stdout + refusal.stderr).not.toContain("every member is done");
  });
});
