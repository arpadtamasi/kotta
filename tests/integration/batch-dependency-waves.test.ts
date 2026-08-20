import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";
import { readEvents } from "../../src/core/events.js";

const cli = resolve("dist/cli/index.js");

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function run(cwd: string, args: string[], env?: NodeJS.ProcessEnv) {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8", env: env ?? process.env });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
}

function attempt(cwd: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
}

function defineContract(root: string, title: string) {
  const created = run(root, ["contract", "new", "--title", title, "--type", "feature"]);
  const { id, path } = created.data as { id: string; path: string };
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Run integration tests."));
  run(root, ["contract", "sign", id, "--approve"]);
  return { id, filename: basename(path) };
}

function dependencyBatch(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-batch-wave-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  retainLegacySignGate(root);

  const predecessor = defineContract(root, "Build predecessor");
  const dependent = defineContract(root, "Build dependent");
  const dependentPath = join(root, ".kotta", "process", "defined", dependent.filename);
  writeFileSync(dependentPath, readFileSync(dependentPath, "utf8")
    .replace("depends_on: []", `depends_on:\n  - ${predecessor.id}`));

  const batch = run(root, ["batch", "new", "--title", `Wave ${label}`, "--goal", "Ship both waves"]);
  const batchId = String(batch.data.id);
  run(root, ["batch", "add", batchId, predecessor.id]);
  run(root, ["batch", "add", batchId, dependent.id]);
  run(root, ["batch", "sign", batchId, "--approve"]);
  git(root, "add", ".");
  git(root, "commit", "-m", "define dependency batch");
  return { root, batchId, predecessor, dependent };
}

function submitPredecessor(root: string, batchId: string, predecessorId: string, integrate: boolean) {
  expect(run(root, ["batch", "start", batchId, "--agent", "codex"]).data).toMatchObject({
    started: [predecessorId],
  });
  const worktree = join(root, ".worktrees", predecessorId);
  writeFileSync(join(worktree, "predecessor.txt"), "integrated predecessor\n");
  git(worktree, "add", "predecessor.txt");
  git(worktree, "commit", "-m", "feat: predecessor");
  run(worktree, ["contract", "review", predecessorId, "--evidence", "predecessor verified", "--deviations", "None."]);
  if (integrate) {
    const coordinator = join(root, ".worktrees", "batches", batchId);
    git(coordinator, "merge", "--no-ff", git(worktree, "branch", "--show-current"), "-m", "merge predecessor");
  }
}

describe("dependency-aware batch waves", () => {
  test("dispatches a reviewed and coordinator-integrated dependency from the exact coordinator head", () => {
    const { root, batchId, predecessor, dependent } = dependencyBatch("integrated");
    submitPredecessor(root, batchId, predecessor.id, true);
    const coordinatorBranch = `coord/${batchId}`;
    const coordinatorCommit = git(root, "rev-parse", coordinatorBranch);

    const next = run(root, ["batch", "start", batchId, "--agent", "codex"]);

    expect(next.data).toMatchObject({
      started: [dependent.id],
      starts: [{ id: dependent.id, startRef: coordinatorBranch, startCommit: coordinatorCommit }],
    });
    const dependentWorktree = join(root, ".worktrees", dependent.id);
    expect(git(dependentWorktree, "rev-parse", "HEAD")).toBe(coordinatorCommit);
    expect(readFileSync(join(dependentWorktree, "predecessor.txt"), "utf8")).toBe("integrated predecessor\n");
    expect(readFileSync(join(root, ".kotta", "process", "claims", `${dependent.id}.yaml`), "utf8")).toContain([
      `start_ref: ${coordinatorBranch}`,
      `start_commit: ${coordinatorCommit}`,
      `dependency_integration_target: ${coordinatorBranch}`,
    ].join("\n"));
    expect(existsSync(join(root, ".kotta", "process", "review", predecessor.filename))).toBe(true);
    expect(run(root, ["batch", "status", batchId]).data).toMatchObject({ status: "active" });
    const closeWithoutApproval = attempt(root, ["contract", "close", predecessor.id]);
    expect(closeWithoutApproval.status).toBe(1);
    expect(closeWithoutApproval.stdout + closeWithoutApproval.stderr).toContain("Human done approval is required");
    expect(readEvents(root, dependent.id).find((event) => event.kind === "lifecycle" && event.state === "active")?.summary)
      .toContain(`from ${coordinatorBranch} at ${coordinatorCommit}`);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
  });

  test("keeps a reviewed but unintegrated dependency waiting without creating execution state", () => {
    const { root, batchId, predecessor, dependent } = dependencyBatch("unintegrated");
    submitPredecessor(root, batchId, predecessor.id, false);
    const headsBefore = git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads");

    const next = run(root, ["batch", "start", batchId, "--agent", "codex"]);

    expect(next.data).toMatchObject({ started: [], waiting: expect.arrayContaining([dependent.id]) });
    expect(existsSync(join(root, ".worktrees", dependent.id))).toBe(false);
    expect(existsSync(join(root, ".kotta", "process", "claims", `${dependent.id}.yaml`))).toBe(false);
    expect(git(root, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads")).toBe(headsBefore);
  });

  test("standalone contract start still requires dependencies to be done", () => {
    const { root, batchId, predecessor, dependent } = dependencyBatch("standalone");
    submitPredecessor(root, batchId, predecessor.id, true);

    const refusal = attempt(root, ["contract", "start", dependent.id, "--agent", "codex"]);

    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`Unresolved dependencies: ${predecessor.id}`);
    expect(existsSync(join(root, ".worktrees", dependent.id))).toBe(false);
    expect(existsSync(join(root, ".kotta", "process", "claims", `${dependent.id}.yaml`))).toBe(false);
  });

  test("rolls a coordinator-based contract start back to no branch, worktree, claim, or active state", () => {
    const { root, batchId, predecessor, dependent } = dependencyBatch("rollback");
    submitPredecessor(root, batchId, predecessor.id, true);

    expect(() => run(root, ["batch", "start", batchId, "--agent", "codex"], { ...process.env, KOTTA_TEST_FAIL_START_AT: "after-claim" }))
      .toThrow("Injected start failure after claim creation");

    expect(existsSync(join(root, ".worktrees", dependent.id))).toBe(false);
    expect(existsSync(join(root, ".kotta", "process", "claims", `${dependent.id}.yaml`))).toBe(false);
    expect(git(root, "branch", "--list", `feat/${dependent.id}-build-dependent`)).toBe("");
    expect(existsSync(join(root, ".kotta", "process", "defined", dependent.filename))).toBe(true);
    expect(existsSync(join(root, ".kotta", "process", "active", dependent.filename))).toBe(false);
  });
});
