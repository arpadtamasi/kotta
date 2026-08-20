import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

/**
 * T-036 — directory-as-state duplication (second root of F-008).
 *
 * Every fixture here is a real Git merge: two branches carry one entity into different state
 * directories, and the merge keeps both copies. Only the resolution differs between them.
 */

const cli = resolve("dist/cli/index.js");

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

interface Report {
  ok: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
}

function repository(label: string, options: { detectRenames?: boolean } = {}): string {
  // realpath: on macOS the temp directory is a symlink, and the CLI reports resolved paths.
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-duplicate-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  // A merge only pairs a cross-directory move as delete+add while rename detection is on; a large
  // merge (or `merge.renames=false`) drops it, and then both copies survive. Both shapes are real.
  if (options.detectRenames === false) git(root, "config", "merge.renames", "false");
  run(root, ["init"]);
  retainLegacySignGate(root);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init kotta");
  return root;
}

/** Finish a conflicted merge the way a hurried human does: keep both sides' files verbatim. */
function keepBothSides(root: string, files: Array<{ branch: string; path: string }>): void {
  for (const file of files) git(root, "checkout", file.branch, "--", file.path);
  git(root, "add", "-A");
  git(root, "commit", "-m", "merge: kept both copies");
}

describe("one entity in two state directories (T-036)", () => {
  test("validate names both places after a merge, and dedupe keeps the furthest-advanced copy", () => {
    const root = repository("contract");
    const contract = run(root, ["contract", "new", "--title", "Merge me", "--type", "feature"]).data as { id: string; path: string };
    const filename = basename(contract.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture contract");

    // Build the historical split while main remains the checked-out control plane. Modern Kotta
    // no longer creates this shape, but dedupe must still repair repositories that already have it.
    const commonBase = git(root, "rev-parse", "HEAD");
    run(root, ["contract", "sign", contract.id, "--approve"]);
    git(root, "branch", "branch-defined");
    git(root, "reset", "--hard", commonBase);
    run(root, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Retired to produce the duplicated state", "--approve"]);

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-defined", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (rename/rename)");
    keepBothSides(root, [
      { branch: "branch-defined", path: `.kotta/process/defined/${filename}` },
      { branch: "main", path: `.kotta/process/done/${filename}` },
    ]);
    const defined = join(root, ".kotta/process/defined", filename);
    const done = join(root, ".kotta/process/done", filename);
    expect(existsSync(defined) && existsSync(done)).toBe(true);

    // Acceptance 1: the duplicate is its own error case and names both places.
    const validation = attempt(root, ["validate"]);
    expect(validation.status).toBe(1);
    const report = JSON.parse(validation.stdout) as Report;
    const duplicate = report.errors.find((error) => error.code === "DUPLICATE_STATE");
    expect(duplicate).toBeDefined();
    expect(duplicate?.message).toContain(defined);
    expect(duplicate?.message).toContain(done);
    expect(report.errors.some((error) => error.code === "DUPLICATE_ID")).toBe(false);

    // Acceptance 5: without approval nothing is removed.
    const unapproved = attempt(root, ["contract", "dedupe", contract.id]);
    expect(unapproved.status).toBe(1);
    expect(unapproved.stdout).toContain("Human approval is required");
    expect(existsSync(defined) && existsSync(done)).toBe(true);

    // Acceptance 2: the later lifecycle state wins and the discarded copy is named — here in the
    // human-readable output; the batch test below asserts the same in the structured result.
    const resolved = spawnSync("node", [cli, "contract", "dedupe", contract.id, "--approve"], { cwd: root, encoding: "utf8" });
    expect(resolved.status).toBe(0);
    expect(resolved.stdout).toContain(`Kept ${contract.id} at ${done} (done)`);
    expect(resolved.stdout).toContain(`dropped ${defined} (defined`);
    expect(existsSync(defined)).toBe(false);
    expect(existsSync(done)).toBe(true);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });

    // Re-running finds a single copy and refuses rather than silently doing nothing.
    const again = attempt(root, ["contract", "dedupe", contract.id, "--approve"]);
    expect(again.status).toBe(1);
    expect(again.stdout).toContain("nothing to resolve");
  });

  test("a batch duplicated across batches/backlog and batches/defined resolves the same way", () => {
    const root = repository("batch", { detectRenames: false });
    const first = run(root, ["contract", "new", "--title", "First slice", "--type", "feature"]).data as { id: string };
    const second = run(root, ["contract", "new", "--title", "Second slice", "--type", "feature"]).data as { id: string };
    run(root, ["contract", "sign", first.id, "--approve"]);
    const batch = run(root, ["batch", "new", "--title", "Batch one", "--goal", "Ship the slices"]).data as { id: string; path: string };
    run(root, ["batch", "add", batch.id, first.id]);
    const filename = basename(batch.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture batch");

    // Reconstruct the pre-control-plane P-015 shape without checking main out elsewhere.
    const commonBase = git(root, "rev-parse", "HEAD");
    run(root, ["batch", "sign", batch.id, "--approve"]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "defined batch");
    git(root, "branch", "branch-defined");
    git(root, "reset", "--hard", commonBase);
    run(root, ["batch", "add", batch.id, second.id]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "add second contract");

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-defined", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (modify/delete)");
    git(root, "add", "-A");
    git(root, "commit", "-m", "merge: kept both copies");
    const backlog = join(root, ".kotta/process/batches/backlog", filename);
    const defined = join(root, ".kotta/process/batches/defined", filename);
    expect(existsSync(backlog) && existsSync(defined)).toBe(true);

    const validation = attempt(root, ["validate"]);
    expect(validation.status).toBe(1);
    const duplicate = (JSON.parse(validation.stdout) as Report).errors.find((error) => error.code === "DUPLICATE_STATE");
    expect(duplicate?.message).toContain(backlog);
    expect(duplicate?.message).toContain(defined);
    expect(duplicate?.message).toContain(`kotta batch dedupe ${batch.id} --approve`);

    expect(attempt(root, ["batch", "dedupe", batch.id]).status).toBe(1);
    expect(existsSync(backlog)).toBe(true);

    const resolved = run(root, ["batch", "dedupe", batch.id, "--approve"]).data as {
      kept: { state: string; path: string };
      dropped: Array<{ state: string; path: string; differing_fields: string[] }>;
    };
    expect(resolved.kept).toEqual({ state: "defined", path: defined });
    // The dropped copy carried a different membership list; the resolution says so instead of hiding it.
    expect(resolved.dropped).toEqual([{ state: "backlog", path: backlog, differing_fields: ["contracts"] }]);
    expect(existsSync(backlog)).toBe(false);
  });

  test("dedupe stops when the two copies have different bodies", () => {
    const root = repository("diverged", { detectRenames: false });
    const contract = run(root, ["contract", "new", "--title", "Contested", "--type", "feature"]).data as { id: string; path: string };
    const filename = basename(contract.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture contract");

    const commonBase = git(root, "rev-parse", "HEAD");
    run(root, ["contract", "sign", contract.id, "--approve"]);
    git(root, "branch", "branch-defined");
    git(root, "reset", "--hard", commonBase);

    // Main rewrites the contract body in place while the other branch moves it to defined.
    const definition = join(root, "definition.md");
    const body = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"]
      .map((heading) => `## ${heading}\n\n${heading === "Open decisions" ? "None." : `Rewritten ${heading.toLowerCase()} that the other branch never saw.`}`)
      .join("\n\n");
    writeFileSync(definition, `---\ntypes:\n  - feature\n---\n${body}\n`);
    run(root, ["contract", "define", contract.id, "--from", definition]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "rewrite body");

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-defined", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT (modify/delete)");
    git(root, "add", "-A");
    git(root, "commit", "-m", "merge: kept both copies");
    const backlog = join(root, ".kotta/process/backlog", filename);
    const defined = join(root, ".kotta/process/defined", filename);
    expect(existsSync(backlog) && existsSync(defined)).toBe(true);

    // Acceptance 3: divergent bodies are not a machine decision.
    const refused = attempt(root, ["contract", "dedupe", contract.id, "--approve"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("different bodies");
    expect(refused.stdout).toContain(backlog);
    expect(refused.stdout).toContain(defined);
    expect(existsSync(backlog) && existsSync(defined)).toBe(true);
    expect((JSON.parse(attempt(root, ["validate"]).stdout) as Report).errors.some((error) => error.code === "DUPLICATE_STATE")).toBe(true);
  });

  test("dedupe refuses an identifier collision inside one state directory", () => {
    const root = repository("collision");
    const contract = run(root, ["contract", "new", "--title", "Shared identity", "--type", "feature"]).data as { id: string; path: string };
    const twin = join(root, ".kotta/process/backlog", `other-${basename(contract.path)}`);
    copyFileSync(contract.path, twin);
    writeFileSync(twin, readFileSync(twin, "utf8").replace("title: Shared identity", "title: A different entity"));

    const refused = attempt(root, ["contract", "dedupe", contract.id, "--approve"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("identifier collision");
    expect(existsSync(twin)).toBe(true);
  });
});
