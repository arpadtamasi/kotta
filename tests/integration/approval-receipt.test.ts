import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

/**
 * Every approval is recorded on the entity it approved - who, when, and on what basis
 * (BR-01m0f0wn89zb3wfb3t3y4d20a7, EX-01m0f0wn8am4hb2vy03wmn4brs). The surface clause of the same
 * rule, that a gate reaches both the CLI and the calling chat, is proven in gate-surfaces.test.ts.
 */

const cli = resolve("dist/cli/index.js");

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

/** The human-facing (non-JSON) rendering, for the show-output-is-readable assertions. */
function text(repository: string, args: string[]): string {
  const result = spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function fail(repository: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
}

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" });
}

/** The three receipt fields, read straight off a stored entity's frontmatter. */
function receipt(path: string): { approved_by?: string; approved_at?: string; approval_basis?: string } {
  const front = readFileSync(path, "utf8").split(/\n---/)[0];
  // YAML quotes an ISO string so it does not reload as a native timestamp; unwrap it for the test.
  const unquote = (value?: string) => value?.replace(/^['"]|['"]$/g, "");
  const field = (name: string) => unquote(front.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]);
  return { approved_by: field("approved_by"), approved_at: field("approved_at"), approval_basis: field("approval_basis") };
}

function expectReceipt(path: string, basisAction: string): void {
  const stamp = receipt(path);
  expect(stamp.approved_by, `${path} approved_by`).toBeTruthy();
  expect(Number.isFinite(Date.parse(String(stamp.approved_at))), `${path} approved_at is a timestamp`).toBe(true);
  expect(stamp.approval_basis, `${path} approval_basis`).toContain(basisAction);
}

function newTask(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["task", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
}

function definedTask(repository: string, title: string): { id: string; path: string } {
  const task = newTask(repository, title);
  run(repository, ["task", "define", task.id, "--from", coveredDefinition(task.path, {
    outcome: "The outcome is observable.",
    acceptance: ["The condition is observable."],
    verification: "The condition is checked by reading it.",
  })]);
  return task;
}

/** A task taken all the way to review, its branch merged into the control branch, ready to close. */
function reviewedTask(repository: string, title: string): { id: string; filename: string; branch: string } {
  const task = definedTask(repository, title);
  const branch = (run(repository, ["task", "start", task.id, "--agent", "codex"]) as { data: { branch: string } }).data.branch;
  const worktree = join(repository, ".worktrees", task.id);
  writeFileSync(join(worktree, `${task.id}.md`), `# ${task.id}\n`);
  git(worktree, "add", ".");
  git(worktree, "commit", "-m", `feat: ${task.id}`);
  run(worktree, ["task", "review", task.id, "--evidence", "Implemented and verified", "--deviations", "None."]);
  return { id: task.id, filename: basename(task.path), branch };
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
  // init now also creates the project's AGENTS.md where there is none
  // (BR-01m0f1djtb5dkb76tjzq4x3ffh), and it leaves everything it wrote untracked.
  git(repository, "add", ".gitattributes", ".gitignore", "AGENTS.md");
  git(repository, "commit", "-m", "initialize Kotta metadata");
  return repository;
}

function taskPath(repository: string, filename: string): string {
  return join(repository, ".kotta/process/tasks", filename);
}

/** The lifecycle state, read straight off a stored entity's frontmatter. */
function status(path: string): string | undefined {
  return readFileSync(path, "utf8").match(/^status: (.+)$/m)?.[1];
}

/** Kotta commits the canonical state it writes (BR-01m0f0wn89r5np2yce79y2pctq), so a fixture
 *  commits only what it changed itself — and an empty commit would fail. */
function commitIfDirty(root: string, message: string): void {
  git(root, "add", "-A");
  if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", message);
}

describe("every approval leaves a receipt", () => {
  test("closing a reviewed task stamps the receipt, shows it, and validates green", () => {
    const repository = fixture("kotta-receipt-close-");
    const { id, filename, branch } = reviewedTask(repository, "Add filtered export");
    git(repository, "merge", "--no-ff", branch, "-m", `merge ${id}`);

    run(repository, ["task", "close", id, "--approve"]);
    const path = taskPath(repository, filename);
    expect(status(path)).toBe("done");
    expectReceipt(path, "task.close");
    // The receipt is visible in show output, on the human-readable surface.
    const shown = text(repository, ["task", "show", id]);
    expect(shown).toContain("approved_by");
    expect(shown).toContain("approval_basis");
    // It survives a round-trip: validation of the freshly-closed record stays green.
    expect(run(repository, ["task", "validate", id])).toMatchObject({ ok: true, data: { state: "done" } });
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("cancelling a task stamps the receipt onto the retired record", () => {
    const repository = fixture("kotta-receipt-cancel-");
    const task = newTask(repository, "Abandoned work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");

    run(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "No longer wanted", "--approve"]);
    expect(status(task.path)).toBe("done");
    expectReceipt(taskPath(repository, basename(task.path)), "task.cancel");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("reopening a submitted task for changes stamps the request-changes receipt", () => {
    const repository = fixture("kotta-receipt-reopen-");
    const { id, filename } = reviewedTask(repository, "Needs another pass");

    run(repository, ["task", "reopen", id, "--approve"]);
    const active = taskPath(repository, filename);
    expect(existsSync(active)).toBe(true);
    expect(status(active)).toBe("active");
    expectReceipt(active, "task.request-changes");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("resolving an observation stamps the receipt and shows it on both the record and show output", () => {
    const repository = fixture("kotta-receipt-observation-");
    const created = run(repository, ["observation", "new", "--title", "Logs look inconsistent", "--type", "bug", "--evidence", "Two lines disagree"]) as { data: { id: string } };

    run(repository, ["observation", "resolve", created.data.id, "--disposition", "investigate", "--approve"]);
    expectReceipt(observationPath(repository, created.data.id), "observation.resolve");
    expect(text(repository, ["observation", "show", created.data.id])).toContain("approval_basis");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("creating a decision stamps the receipt into the durable record", () => {
    const repository = fixture("kotta-receipt-decision-");
    const source = join(repository, "decision.md");
    writeFileSync(source, "---\ntitle: Slugs stay as they are\n---\n\n## Decision\n\nSlugs stay as they are.\n\n## Context\n\nThe question came up and was settled.\n\n## Consequences\n\nWork assuming otherwise is retired.\n");
    const created = run(repository, ["decision", "create", "--from", source, "--approve"]) as { data: { id: string; path: string } };
    unlinkSync(source);

    expectReceipt(created.data.path, "decision.create");
    expect(text(repository, ["decision", "show", created.data.id])).toContain("approved_by");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "record decision");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("closing a batch stamps the receipt onto the batch record", () => {
    const repository = fixture("kotta-receipt-batch-");
    const task = reviewedTask(repository, "Only slice");
    git(repository, "merge", "--no-ff", task.branch, "-m", `merge ${task.id}`);
    run(repository, ["task", "close", task.id, "--approve"]);

    const batch = run(repository, ["batch", "new", "--title", "One slice", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    run(repository, ["batch", "add", batch.data.id, task.id]);
    git(repository, "add", ".");
    commitIfDirty(repository, "define batch");

    run(repository, ["batch", "close", batch.data.id, "--approve"]);
    const batchPath = join(repository, ".kotta/process/batches", basename(batch.data.path));
    expect(status(batchPath)).toBe("done");
    expectReceipt(batchPath, "batch.close");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("a gated mutation without approval is still refused, naming the rule, and writes no receipt", () => {
    const repository = fixture("kotta-receipt-refusal-");
    const task = newTask(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");

    const refused = fail(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "No longer wanted"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human cancel approval is required");
    expect(receipt(task.path).approved_by).toBeUndefined();
  });

  test("an entity approved before receipts existed keeps validating: absence is legal history", () => {
    const repository = fixture("kotta-receipt-legacy-");
    const task = newTask(repository, "Retired before receipts");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture task");
    run(repository, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    const path = taskPath(repository, basename(task.path));
    expect(status(path)).toBe("done");

    // Strip the whole receipt: a historical record simply lacks the three fields.
    const stripped = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => !/^(approved_by|approved_at|approval_basis):/.test(line)).join("\n");
    writeFileSync(path, stripped);
    expect(run(repository, ["task", "validate", task.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // But a half-written receipt — some fields, not all — is a real inconsistency.
    writeFileSync(path, stripped.replace("status: done", "status: done\napproved_by: someone"));
    const report = fail(repository, ["task", "validate", task.id]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("INCOMPLETE_APPROVAL_RECEIPT");
  });
});

/** The stored path of an observation, resolved or not, without leaning on show's JSON shape. */
function observationPath(repository: string, id: string): string {
  const directory = join(repository, ".kotta/process/observations");
  if (existsSync(directory)) {
    const found = readdirSync(directory).find((name) => name.endsWith(".md") && (name.includes(id.slice(-8)) || name.startsWith(`${id}-`)));
    if (found) return join(directory, found);
  }
  throw new Error(`Observation ${id} not found on disk.`);
}
