import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

describe("dependency-aware batch", () => {
  test("creates a backlog batch and keeps contract membership in sync", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-batch-membership-"));
    git(root, "init", "-b", "main");
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const batch = (run(root, ["batch", "new", "--title", "Launch batch", "--goal", "Ship the first slice", "--parallelism", "1"]) as { ok: boolean; data: { id: string; path: string } });
    expect(batch.ok).toBe(true);
    expect(batch.data.id).toMatch(/^P-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(batch.data.path)).toBe(`launch-batch-${batch.data.id.slice(-8)}.md`);
    const batchFile = readFileSync(batch.data.path, "utf8");
    expect(batchFile).toContain("parallelism: 1");
    expect(batchFile).toContain("create_observations: true");
    const contract = (run(root, ["contract", "new", "--title", "Prepare release", "--type", "feature"]) as { data: { id: string; path: string } }).data;
    expect(run(root, ["batch", "add", batch.data.id, contract.id])).toMatchObject({ ok: true, data: { contracts: [contract.id] } });
    expect(readFileSync(contract.path, "utf8")).toContain(`batch: ${batch.data.id}`);
    expect(run(root, ["batch", "remove", batch.data.id, contract.id])).toMatchObject({ ok: true, data: { contracts: [] } });
    expect(readFileSync(contract.path, "utf8")).toContain("batch: null");
  });

  test("plans all dependency layers and starts only currently executable contracts", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-batch-"));
    git(root, "init", "-b", "main"); git(root, "config", "user.name", "Kotta Test"); git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    const contracts: Array<{ id: string; filename: string }> = [];
    for (const title of ["Build parser", "Expose command"]) {
      const created = run(root, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
      const path = created.data.path;
      writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", `${title} works.`).replace("- Define an observable condition.", `- ${title} is observable.`).replace("- Explain how acceptance will be checked.", "- Run integration tests."));
      run(root, ["contract", "sign", created.data.id, "--approve"]);
      contracts.push({ id: created.data.id, filename: basename(path) });
    }
    const [parser, command] = contracts;
    const second = join(root, ".kotta/process/defined", command.filename);
    writeFileSync(second, readFileSync(second, "utf8").replace("depends_on: []", `depends_on:\n  - ${parser.id}`));
    const batchId = (run(root, ["batch", "new", "--title", "Parser slice", "--goal", "Deliver a parser slice"]) as { data: { id: string } }).data.id;
    run(root, ["batch", "add", batchId, parser.id]);
    run(root, ["batch", "add", batchId, command.id]);
    const blockedBacklog = join(root, ".kotta/process/backlog", command.filename);
    writeFileSync(blockedBacklog, readFileSync(second, "utf8").replace("status: defined", "status: backlog"));
    unlinkSync(second);
    expect(run(root, ["batch", "sign", batchId, "--approve"])).toMatchObject({ ok: true, command: "batch sign" });
    git(root, "add", "."); git(root, "commit", "-m", "define batch");

    expect(run(root, ["batch", "validate", batchId])).toMatchObject({ ok: true, data: { waves: [[parser.id], [command.id]] } });
    expect(run(root, ["batch", "start", batchId, "--agent", "codex"])).toMatchObject({ ok: true, data: { started: [parser.id], waiting: [command.id] } });
    expect(existsSync(join(root, ".kotta/process/claims", `${parser.id}.yaml`))).toBe(true);
    expect(existsSync(join(root, ".worktrees", command.id))).toBe(false);
    expect(run(root, ["batch", "status", batchId])).toMatchObject({
      ok: true,
      data: { status: "active", contracts: [{ id: parser.id, state: "active", worktree: expect.stringContaining(`.worktrees/${parser.id}`) }, { id: command.id, state: "backlog" }] },
    });
    const workspace = readWorkspace(root);
    expect(workspace.contracts.filter((contract) => contract.id === parser.id)).toEqual([
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
  return root;
}

function definedContract(root: string, title: string) {
  const created = run(root, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } };
  const { id, path } = created.data;
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Run integration tests."));
  run(root, ["contract", "sign", id, "--approve"]);
  return { id, filename: basename(path) };
}

/** Everything a refusal must leave untouched. */
const snapshot = (root: string) => ({
  status: git(root, "status", "--porcelain"),
  head: git(root, "rev-parse", "HEAD"),
  workspace: git(root, "ls-files", ".kotta"),
});

const batchFile = (root: string, state: string, filename: string) => join(root, ".kotta/process/batches", state, filename);

/**
 * The P-005 shape: a batch still in `backlog` whose contracts reached done outside the batch
 * flow. Membership is recorded after the fact, exactly as it is for a batch nobody ever started.
 */
function backlogBatchWithMembers(label: string, members: Array<"done" | "defined">) {
  const root = workspaceRepository(label);
  const contracts = members.map((_member, index) => definedContract(root, `Slice ${index + 1}`));
  git(root, "add", ".");
  git(root, "commit", "-m", "define contracts");
  // `contract cancel` is a supported writer into `done`; it needs a clean tree and commits itself.
  members.forEach((member, index) => {
    if (member === "done") run(root, ["contract", "cancel", contracts[index].id, "--resolution", "cancelled", "--reason", "Retired to place a done member in the batch", "--approve"]);
  });
  const created = run(root, ["batch", "new", "--title", `Batch ${label}`, "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
  for (const contract of contracts) run(root, ["batch", "add", created.data.id, contract.id]);
  git(root, "add", ".");
  git(root, "commit", "-m", "define batch");
  return { root, batchId: created.data.id, filename: basename(created.data.path), contracts };
}

describe("batch close", () => {
  test("closes a backlog batch whose member contracts are all done", () => {
    const { root, batchId, filename, contracts } = backlogBatchWithMembers("closeable", ["done", "done"]);
    const contractsBefore = contracts.map((contract) => readFileSync(join(root, ".kotta/process/done", contract.filename), "utf8"));

    const closed = run(root, ["batch", "close", batchId, "--approve"]);
    expect(closed).toMatchObject({ ok: true, command: "batch close", data: { id: batchId, status: "done", changed: true } });
    expect(existsSync(batchFile(root, "backlog", filename))).toBe(false);
    expect(readFileSync(batchFile(root, "done", filename), "utf8")).toContain("status: done");
    expect(run(root, ["batch", "status", batchId])).toMatchObject({ ok: true, data: { id: batchId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    // Closing a batch never touches its contracts.
    expect(contracts.map((contract) => readFileSync(join(root, ".kotta/process/done", contract.filename), "utf8"))).toEqual(contractsBefore);
    expect(git(root, "status", "--porcelain")).toBe("");

    // Re-closing a finished batch is a no-op rather than an error.
    const before = snapshot(root);
    expect(run(root, ["batch", "close", batchId, "--approve"])).toMatchObject({ ok: true, data: { status: "done", changed: false } });
    expect(snapshot(root)).toEqual(before);
  });

  test("refuses a batch with a non-terminal member, names it, and changes nothing", () => {
    const { root, batchId, filename, contracts } = backlogBatchWithMembers("mixed", ["done", "defined"]);
    const before = snapshot(root);
    const batchBefore = readFileSync(batchFile(root, "backlog", filename), "utf8");

    const refusal = attempt(root, ["batch", "close", batchId, "--approve"]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain(`${contracts[1].id} is defined`);
    expect(snapshot(root)).toEqual(before);
    expect(readFileSync(batchFile(root, "backlog", filename), "utf8")).toBe(batchBefore);
    expect(existsSync(batchFile(root, "done", filename))).toBe(false);
    expect(existsSync(join(root, ".kotta/process/defined", contracts[1].filename))).toBe(true);
  });

  test("requires human approval", () => {
    const { root, batchId, filename } = backlogBatchWithMembers("approval", ["done"]);
    const before = snapshot(root);

    const refusal = attempt(root, ["batch", "close", batchId]);
    expect(refusal.status).toBe(1);
    expect(refusal.stdout + refusal.stderr).toContain("Human close approval is required");
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(batchFile(root, "backlog", filename))).toBe(true);
  });

  test("closing the last contract completes a batch that never went active", () => {
    const root = workspaceRepository("autocomplete");
    const contract = definedContract(root, "Only slice");
    const created = run(root, ["batch", "new", "--title", "Never started", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    const batchId = created.data.id;
    const filename = basename(created.data.path);
    run(root, ["batch", "add", batchId, contract.id]);
    git(root, "add", ".");
    git(root, "commit", "-m", "define batch");

    const branch = (run(root, ["contract", "start", contract.id, "--agent", "codex"]) as { data: { branch: string } }).data.branch;
    const worktree = join(root, ".worktrees", contract.id);
    writeFileSync(join(worktree, `${contract.id}.md`), `# ${contract.id}\n`);
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", `feat: ${contract.id}`);
    run(worktree, ["contract", "review", contract.id, "--evidence", "verified", "--deviations", "None."]);
    git(root, "merge", "--no-ff", branch, "-m", `merge ${contract.id}`);
    // The batch was never started; completion used to scan `batches/active` only.
    expect(existsSync(batchFile(root, "backlog", filename))).toBe(true);

    run(root, ["contract", "close", contract.id, "--approve"]);
    expect(existsSync(batchFile(root, "backlog", filename))).toBe(false);
    expect(readFileSync(batchFile(root, "done", filename), "utf8")).toContain("status: done");
    expect(run(root, ["batch", "status", batchId])).toMatchObject({ ok: true, data: { id: batchId, status: "done" } });
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(git(root, "status", "--porcelain")).toBe("");
  });
});
