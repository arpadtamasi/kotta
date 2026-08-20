import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

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

function newContract(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
}

function definedContract(repository: string, title: string): { id: string; path: string } {
  const contract = newContract(repository, title);
  writeFileSync(contract.path, readFileSync(contract.path, "utf8")
    .replace("Describe the observable outcome.", "The outcome is observable.")
    .replace("- Define an observable condition.", "- The condition is observable.")
    .replace("- Explain how acceptance will be checked.", "- The condition is checked by reading it."));
  run(repository, ["contract", "sign", contract.id, "--approve"]);
  return contract;
}

/** A contract taken all the way to review, its branch merged into the control branch, ready to close. */
function reviewedContract(repository: string, title: string): { id: string; filename: string; branch: string } {
  const contract = definedContract(repository, title);
  const branch = (run(repository, ["contract", "start", contract.id, "--agent", "codex"]) as { data: { branch: string } }).data.branch;
  const worktree = join(repository, ".worktrees", contract.id);
  writeFileSync(join(worktree, `${contract.id}.md`), `# ${contract.id}\n`);
  git(worktree, "add", ".");
  git(worktree, "commit", "-m", `feat: ${contract.id}`);
  run(worktree, ["contract", "review", contract.id, "--evidence", "Implemented and verified", "--deviations", "None."]);
  return { id: contract.id, filename: basename(contract.path), branch };
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
  retainLegacySignGate(repository);
  git(repository, "add", ".gitattributes", ".gitignore");
  git(repository, "commit", "-m", "initialize Kotta metadata");
  return repository;
}

function donePath(repository: string, filename: string): string {
  return join(repository, ".kotta/process/done", filename);
}

describe("every approval leaves a receipt", () => {
  test("closing a reviewed contract stamps the receipt, shows it, and validates green", () => {
    const repository = fixture("kotta-receipt-close-");
    const { id, filename, branch } = reviewedContract(repository, "Add filtered export");
    git(repository, "merge", "--no-ff", branch, "-m", `merge ${id}`);

    run(repository, ["contract", "close", id, "--approve"]);
    const path = donePath(repository, filename);
    expectReceipt(path, "contract.close");
    // The receipt is visible in show output, on the human-readable surface.
    const shown = text(repository, ["contract", "show", id]);
    expect(shown).toContain("approved_by");
    expect(shown).toContain("approval_basis");
    // It survives a round-trip: validation of the freshly-closed record stays green.
    expect(run(repository, ["contract", "validate", id])).toMatchObject({ ok: true, data: { state: "done" } });
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("cancelling a contract stamps the receipt onto the retired record", () => {
    const repository = fixture("kotta-receipt-cancel-");
    const contract = newContract(repository, "Abandoned work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "No longer wanted", "--approve"]);
    expectReceipt(donePath(repository, basename(contract.path)), "contract.cancel");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("reopening a submitted contract for changes stamps the request-changes receipt", () => {
    const repository = fixture("kotta-receipt-reopen-");
    const { id, filename } = reviewedContract(repository, "Needs another pass");

    run(repository, ["contract", "reopen", id, "--approve"]);
    const active = join(repository, ".kotta/process/active", filename);
    expect(existsSync(active)).toBe(true);
    expectReceipt(active, "contract.request-changes");
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
    const contract = reviewedContract(repository, "Only slice");
    git(repository, "merge", "--no-ff", contract.branch, "-m", `merge ${contract.id}`);
    run(repository, ["contract", "close", contract.id, "--approve"]);

    const batch = run(repository, ["batch", "new", "--title", "One slice", "--goal", "Ship the slice"]) as { data: { id: string; path: string } };
    run(repository, ["batch", "add", batch.data.id, contract.id]);
    git(repository, "add", ".");
    git(repository, "commit", "-m", "define batch");

    run(repository, ["batch", "close", batch.data.id, "--approve"]);
    expectReceipt(join(repository, ".kotta/process/batches/done", basename(batch.data.path)), "batch.close");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("a gated mutation without approval is still refused, naming the rule, and writes no receipt", () => {
    const repository = fixture("kotta-receipt-refusal-");
    const contract = newContract(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    const refused = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "No longer wanted"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("Human cancel approval is required");
    expect(receipt(contract.path).approved_by).toBeUndefined();
  });

  test("an entity approved before receipts existed keeps validating: absence is legal history", () => {
    const repository = fixture("kotta-receipt-legacy-");
    const contract = newContract(repository, "Retired before receipts");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    const path = donePath(repository, basename(contract.path));

    // Strip the whole receipt: a historical record simply lacks the three fields.
    const stripped = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => !/^(approved_by|approved_at|approval_basis):/.test(line)).join("\n");
    writeFileSync(path, stripped);
    expect(run(repository, ["contract", "validate", contract.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // But a half-written receipt — some fields, not all — is a real inconsistency.
    writeFileSync(path, stripped.replace("status: done", "status: done\napproved_by: someone"));
    const report = fail(repository, ["contract", "validate", contract.id]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("INCOMPLETE_APPROVAL_RECEIPT");
  });
});

/** The stored path of an observation, resolved or not, without leaning on show's JSON shape. */
function observationPath(repository: string, id: string): string {
  for (const state of ["resolved", "new"]) {
    const directory = join(repository, ".kotta/process/observations", state);
    if (!existsSync(directory)) continue;
    const found = readdirSync(directory).find((name) => name.endsWith(".md") && (name.includes(id.slice(-8)) || name.startsWith(`${id}-`)));
    if (found) return join(directory, found);
  }
  throw new Error(`Observation ${id} not found on disk.`);
}
