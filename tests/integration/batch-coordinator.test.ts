import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";
import { classifyBaseUpdate, classifyIntegration, coordinatorBranchName, linkedWorktrees } from "../../src/git/coordinator.js";
import { readWorkspaceConfig } from "../../src/core/config.js";

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

/** Everything a refusal must leave untouched. */
const snapshot = (root: string) => ({
  branch: git(root, "branch", "--show-current"),
  status: git(root, "status", "--porcelain"),
  heads: git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads"),
  remotes: git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/remotes"),
});

function definedTask(root: string, title: string) {
  const created = run(root, ["task", "new", "--title", title, "--type", "feature"]);
  const { id, path } = created.data as { id: string; path: string };
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Run integration tests."));
  run(root, ["task", "sign", id, "--approve"]);
  return { id, filename: basename(path) };
}

/** An initialized repository whose `main` tracks a bare remote, with one defined batch. */
function workspaceWithBatch(label: string, options: { tasks?: number } = {}) {
  const remote = mkdtempSync(join(tmpdir(), `kotta-coord-remote-${label}-`));
  execFileSync("git", ["init", "--bare", "-b", "main"], { cwd: remote });
  const root = mkdtempSync(join(tmpdir(), `kotta-coord-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  retainLegacySignGate(root);
  const tasks = Array.from({ length: options.tasks ?? 1 }, (_unused, index) => definedTask(root, `Deliver slice ${index + 1}`));
  const ids = tasks.map((task) => task.id);
  const batchId = (run(root, ["batch", "new", "--title", `Coordinated ${label}`, "--goal", "Ship the slice"]).data as { id: string }).id;
  for (const id of ids) run(root, ["batch", "add", batchId, id]);
  run(root, ["batch", "sign", batchId, "--approve"]);
  git(root, "add", ".");
  git(root, "commit", "-m", "define batch");
  git(root, "remote", "add", "origin", remote);
  git(root, "push", "-u", "origin", "main");
  return { root, remote, ids, tasks, batchId };
}

function findBatchFile(root: string, batchId: string): string {
  const suffix = `-${batchId.slice(-8)}.md`;
  const directory = join(root, ".kotta/process/batches");
  if (existsSync(directory)) {
    const match = readdirSync(directory).find((name) => name.endsWith(suffix));
    if (match) return join(directory, match);
  }
  throw new Error("batch file not found");
}

/** Drives the batch to done with its coordinator commit on `coord/P-001`, without integrating it. */
function completeBatch(root: string, batchId: string, ids: string[]) {
  run(root, ["batch", "start", batchId, "--agent", "codex"]);
  const coordinator = join(root, ".worktrees", "batches", batchId);
  for (const id of ids) {
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, `${id}.md`), `# ${id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${id}`);
    run(worktree, ["task", "review", id, "--evidence", "verified", "--deviations", "None."]);
    git(coordinator, "merge", "--no-ff", git(worktree, "branch", "--show-current"), "-m", `merge ${id}`);
    run(root, ["task", "close", id, "--approve"]);
  }
}

describe("coordinator helpers", () => {
  test("the coordinator branch name is deterministic", () => {
    expect(coordinatorBranchName("P-001")).toBe("coord/P-001");
    expect(coordinatorBranchName("P-042")).toBe("coord/P-042");
  });

  test("the configured base branch counts as protected even when unlisted", () => {
    const { root, batchId } = workspaceWithBatch("config");
    const configPath = join(root, ".kotta/config.yaml");
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace("base_branch: main", "base_branch: trunk"));
    const config = readWorkspaceConfig(root);
    expect(config.baseBranch).toBe("trunk");
    expect(config.protectedBranches).toContain("trunk");
    expect(config.protectedBranches).toContain("main");
  });

  test("integration is decided by ancestry, not by branch naming", () => {
    const { root, ids, batchId } = workspaceWithBatch("ancestry");
    completeBatch(root, batchId, ids);
    expect(classifyIntegration(root, `coord/${batchId}`, "main")).toMatchObject({ integrated: false, reason: "unmerged" });
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    expect(classifyIntegration(root, `coord/${batchId}`, "main")).toMatchObject({ integrated: true, via: "local-base", ref: "main" });
  });

  test("base update classification separates current, fast-forward and diverged", () => {
    const { root, batchId } = workspaceWithBatch("baseupdate");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "current" });
    writeFileSync(join(root, "remote-only.md"), "remote\n");
    git(root, "add", "."); git(root, "commit", "-m", "remote work"); git(root, "push", "origin", "main");
    git(root, "reset", "--hard", "HEAD~1");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "fast-forward", remote: "origin/main" });
    writeFileSync(join(root, "local-only.md"), "local\n");
    git(root, "add", "."); git(root, "commit", "-m", "local work");
    expect(classifyBaseUpdate(root, "main")).toMatchObject({ kind: "diverged" });
  });

  test("linked worktrees are listed with the branch each holds", () => {
    const { root, ids, batchId } = workspaceWithBatch("worktrees");
    run(root, ["batch", "start", batchId, "--agent", "codex"]);
    const linked = linkedWorktrees(root);
    expect(linked.some((entry) => entry.path.endsWith(`/${ids[0]}`))).toBe(true);
    expect(linked.every((entry) => entry.path !== root)).toBe(true);
  });
});

describe("batch start owns the coordinator branch", () => {
  test("starting from a clean base creates the branch and records its metadata", () => {
    const { root, batchId } = workspaceWithBatch("create");
    const baseCommit = git(root, "rev-parse", "HEAD");
    const started = run(root, ["batch", "start", batchId, "--agent", "codex"]);
    expect(started.data.coordinator).toMatchObject({ branch: `coord/${batchId}`, base_branch: "main", action: "created" });
    expect(git(root, "branch", "--show-current")).toBe("main");
    expect(existsSync(join(root, ".worktrees", "batches", batchId))).toBe(true);
    const file = readFileSync(findBatchFile(root, batchId), "utf8");
    expect(file).toContain(`branch: coord/${batchId}`);
    expect(file).toContain("base_branch: main");
    expect(file).toContain(`base_commit: ${baseCommit}`);
  });

  test("repeating start on the recorded branch is idempotent", () => {
    const { root, batchId } = workspaceWithBatch("resume");
    run(root, ["batch", "start", batchId, "--agent", "codex"]);
    const before = snapshot(root);
    const again = run(root, ["batch", "start", batchId, "--agent", "codex"]);
    expect(again.data.coordinator).toMatchObject({ branch: `coord/${batchId}`, action: "resumed" });
    expect(snapshot(root)).toEqual(before);
  });

  test("starting from a linked unrelated branch still routes to the control plane", () => {
    const { root, batchId } = workspaceWithBatch("unrelated");
    run(root, ["batch", "start", batchId, "--agent", "codex"]);
    const spike = join(root, ".worktrees", "spike");
    git(root, "worktree", "add", spike, "-b", "spike/elsewhere", "HEAD");
    expect(run(spike, ["batch", "start", batchId, "--agent", "codex"]).data.coordinator).toMatchObject({ action: "resumed" });
    expect(git(root, "branch", "--show-current")).toBe("main");
  });

  test("an existing conventional branch is never overwritten by start", () => {
    const { root, batchId } = workspaceWithBatch("collide");
    git(root, "branch", `coord/${batchId}`);
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "start", batchId, "--agent", "codex"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`already exists while batch ${batchId} records no coordinator`);
    expect(snapshot(root)).toEqual(before);
  });
});

describe("batch finalize", () => {
  test("refuses an unmerged coordinator branch and changes nothing", () => {
    const { root, ids, batchId } = workspaceWithBatch("unmerged");
    completeBatch(root, batchId, ids);
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("is not an ancestor of");
    expect(snapshot(root)).toEqual(before);
    expect(run(root, ["batch", "status", batchId]).data.coordinator).toMatchObject({ state: "done-unintegrated", cleanup_pending: false });
  });

  test("switches to the base, fast-forwards it and deletes the merged branch", () => {
    const { root, remote, ids, batchId } = workspaceWithBatch("success");
    completeBatch(root, batchId, ids);
    git(root, "push", "origin", "main");
    // Integration happens elsewhere: push the coordinator branch and merge it into the remote base.
    git(root, "push", "origin", `coord/${batchId}`);
    const integrator = mkdtempSync(join(tmpdir(), "kotta-coord-integrator-"));
    execFileSync("git", ["clone", remote, integrator]);
    execFileSync("git", ["config", "user.name", "Integrator"], { cwd: integrator });
    execFileSync("git", ["config", "user.email", "integrator@example.com"], { cwd: integrator });
    execFileSync("git", ["merge", "--no-ff", `origin/coord/${batchId}`, "-m", `integrate ${batchId}`], { cwd: integrator });
    execFileSync("git", ["push", "origin", "main"], { cwd: integrator });
    git(root, "fetch", "origin");

    expect(run(root, ["batch", "status", batchId]).data.coordinator).toMatchObject({ state: "cleanup-pending", cleanup_pending: true, integration: { integrated: true, via: "remote-base" } });
    const finalized = run(root, ["batch", "finalize", batchId]);
    expect(finalized.data).toMatchObject({ state: "cleaned", branch: `coord/${batchId}` });
    expect(finalized.data.actions).toEqual(["fast-forwarded:main", expect.stringContaining("removed-worktree:"), `deleted-local-branch:coord/${batchId}`]);
    expect(git(root, "branch", "--show-current")).toBe("main");
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${batchId}`);
    // main carries the remote head plus the local finalize commit; nothing was reset away.
    expect(() => git(root, "merge-base", "--is-ancestor", "origin/main", "main")).not.toThrow();
    expect(readFileSync(findBatchFile(root, batchId), "utf8")).toMatch(/cleaned_at: '?\d{4}-\d{2}-\d{2}/);
    // The remote coordinator branch is never touched.
    expect(git(root, "ls-remote", "--heads", "origin", `coord/${batchId}`)).toContain(`coord/${batchId}`);
  });

  test("re-running after success is a no-op", () => {
    const { root, remote, ids, batchId } = workspaceWithBatch("noop");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    git(root, "push", "origin", "main");
    run(root, ["batch", "finalize", batchId]);
    const before = snapshot(root);
    const again = run(root, ["batch", "finalize", batchId]);
    expect(again.data).toMatchObject({ state: "cleaned", actions: [] });
    expect(snapshot(root)).toEqual(before);
    expect(remote).toBeTruthy();
  });

  test("refuses a dirty working tree and leaves it untouched", () => {
    const { root, ids, batchId } = workspaceWithBatch("dirty");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    writeFileSync(join(root, "scratch.md"), "uncommitted\n");
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("has pending changes");
    expect(snapshot(root)).toEqual(before);
    expect(readFileSync(join(root, "scratch.md"), "utf8")).toBe("uncommitted\n");
    expect(run(root, ["batch", "status", batchId]).data.coordinator).toMatchObject({ state: "blocked-dirty" });
  });

  test("refuses while a claim or a task worktree is still linked", () => {
    const { root, ids, batchId } = workspaceWithBatch("inuse", { tasks: 2 });
    // Parallelism 2 starts both tasks; only the first is carried to done.
    completeBatch(root, batchId, [ids[0]]);
    // Force the batch into done while the second task is still claimed and checked out.
    const active = findBatchFile(root, batchId);
    writeFileSync(active, readFileSync(active, "utf8").replace("status: active", "status: done"));
    git(root, "add", "-A");
    git(root, "commit", "-m", "force batch done");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    const output = refusal.stdout + refusal.stderr;
    expect(output).toContain("Active claims remain");
    expect(output).toContain("Task worktrees are still linked");
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(join(root, ".worktrees", ids[1]))).toBe(true);
  });

  test("refuses a diverged local base without resetting anything", () => {
    const { root, ids, batchId } = workspaceWithBatch("diverged");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    git(root, "push", "origin", "main");
    // Rewrite the local base so it no longer fast-forwards onto its remote.
    git(root, "reset", "--hard", "HEAD~1");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate again");
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("have diverged");
    expect(snapshot(root)).toEqual(before);
    expect(run(root, ["batch", "status", batchId]).data.coordinator).toMatchObject({ state: "blocked-diverged" });
  });

  test("refuses when another worktree holds the coordinator branch", () => {
    const { root, ids, batchId } = workspaceWithBatch("held");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    const held = join(root, ".worktrees", "held");
    git(root, "worktree", "remove", join(root, ".worktrees", "batches", batchId));
    git(root, "worktree", "add", held, `coord/${batchId}`);
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`Another worktree holds coord/${batchId}`);
    expect(snapshot(root)).toEqual(before);
    git(root, "worktree", "remove", held);
  });

  test("completes the remaining cleanup after an interruption that already switched branches", () => {
    const { root, ids, batchId } = workspaceWithBatch("resumefinalize");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    // Simulate a crash between the switch and the delete: on the base, branch still present.
    expect(git(root, "branch", "--show-current")).toBe("main");
    const finalized = run(root, ["batch", "finalize", batchId]);
    expect(finalized.data.actions).toEqual([expect.stringContaining("removed-worktree:"), `deleted-local-branch:coord/${batchId}`]);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${batchId}`);
  });

  test("concurrent finalization leaves exactly one deletion and no error", async () => {
    const { root, ids, batchId } = workspaceWithBatch("concurrent");
    completeBatch(root, batchId, ids);
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    const both = await Promise.all([0, 1].map(() => new Promise<{ status: number | null; output: string }>((done) => {
      const child = spawnSync("node", [cli, "batch", "finalize", batchId, "--json"], { cwd: root, encoding: "utf8" });
      done({ status: child.status, output: child.stdout + child.stderr });
    })));
    const deletions = both.filter((result) => result.output.includes(`deleted-local-branch:coord/${batchId}`));
    expect(deletions).toHaveLength(1);
    expect(both.filter((result) => result.status === 0)).toHaveLength(2);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${batchId}`);
  });

  test("refuses before the batch is done", () => {
    const { root, batchId } = workspaceWithBatch("notdone");
    run(root, ["batch", "start", batchId, "--agent", "codex"]);
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("coordinator cleanup runs only after the batch is done");
    expect(snapshot(root)).toEqual(before);
  });
});

describe("legacy batches without coordinator metadata", () => {
  test("an unambiguous conventional branch with ancestry proof is adopted and cleaned", () => {
    const { root, ids, batchId } = workspaceWithBatch("legacy");
    completeBatch(root, batchId, ids);
    // Strip the metadata the way a pre-T-015 batch file looked.
    const file = findBatchFile(root, batchId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    expect(run(root, ["batch", "status", batchId]).data.coordinator).toMatchObject({ legacy: true, state: "cleanup-pending" });
    const finalized = run(root, ["batch", "finalize", batchId]);
    expect(finalized.data.actions).toContain(`adopted-legacy-branch:coord/${batchId}`);
    expect(git(root, "for-each-ref", "--format=%(refname)", "refs/heads")).not.toContain(`coord/${batchId}`);
  });

  test("a legacy batch stops with guidance while its branch is unmerged", () => {
    const { root, ids, batchId } = workspaceWithBatch("legacyunmerged");
    completeBatch(root, batchId, ids);
    const file = findBatchFile(root, batchId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    const before = snapshot(root);
    const refusal = attempt(root, ["batch", "finalize", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("is not an ancestor of");
    expect(snapshot(root)).toEqual(before);
  });

  test("the P-002 shape: refuses while the checkout still carries changes, succeeds once they are handled", () => {
    const { root, ids, batchId } = workspaceWithBatch("p002shape");
    completeBatch(root, batchId, ids);
    const file = findBatchFile(root, batchId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    // P-002 was left on its merged coordinator branch with unrelated next-batch work in the tree.
    writeFileSync(join(root, "next-batch-notes.md"), "P-003 planning\n");
    const blocked = attempt(root, ["batch", "finalize", batchId]);
    expect(blocked.status).toBe(1);
    expect(blocked.stdout + blocked.stderr).toContain("has pending changes");
    expect(readFileSync(join(root, "next-batch-notes.md"), "utf8")).toBe("P-003 planning\n");

    git(root, "add", "."); git(root, "commit", "-m", "keep the next-batch notes");
    const finalized = run(root, ["batch", "finalize", batchId]);
    expect(finalized.data.actions).toContain(`deleted-local-branch:coord/${batchId}`);
    expect(existsSync(join(root, "next-batch-notes.md"))).toBe(true);
  });

  test("a legacy batch with no conventional branch has nothing to clean", () => {
    const { root, ids, batchId } = workspaceWithBatch("legacynone");
    completeBatch(root, batchId, ids);
    const file = findBatchFile(root, batchId);
    writeFileSync(file, readFileSync(file, "utf8").replace(/coordinator:\n(?:  .*\n)+/, ""));
    git(root, "add", "."); git(root, "commit", "-m", "strip coordinator metadata");
    git(root, "switch", "main");
    git(root, "merge", "--no-ff", `coord/${batchId}`, "-m", "integrate");
    git(root, "worktree", "remove", join(root, ".worktrees", "batches", batchId));
    git(root, "branch", "-d", `coord/${batchId}`);
    const finalized = run(root, ["batch", "finalize", batchId]);
    expect(finalized.data).toMatchObject({ state: "cleaned", actions: [] });
  });
});

describe("cleanup never touches unrelated resources", () => {
  test("the batch file, task files and remote refs survive every refusal", () => {
    const { root, tasks, batchId } = workspaceWithBatch("integrity");
    completeBatch(root, batchId, tasks.map((task) => task.id));
    const batchBefore = readFileSync(findBatchFile(root, batchId), "utf8");
    const remoteBefore = git(root, "ls-remote", "origin");
    attempt(root, ["batch", "finalize", batchId]);
    expect(readFileSync(findBatchFile(root, batchId), "utf8")).toBe(batchBefore);
    expect(git(root, "ls-remote", "origin")).toBe(remoteBefore);
    for (const task of tasks) {
      const path = join(root, ".kotta/process/tasks", task.filename);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, "utf8")).toMatch(/^status: done$/m);
    }
  });
});
