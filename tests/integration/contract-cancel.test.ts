import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

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

function newContract(repository: string, title: string): { id: string; path: string } {
  return (run(repository, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
}

/** A contract complete enough to sign, so a cancellation can be tested from every live state. */
function definedContract(repository: string, title: string): { id: string; path: string } {
  const contract = newContract(repository, title);
  writeFileSync(contract.path, readFileSync(contract.path, "utf8")
    .replace("Describe the observable outcome.", "The outcome is observable.")
    .replace("- Define an observable condition.", "- The condition is observable.")
    .replace("- Explain how acceptance will be checked.", "- The condition is checked by reading it."));
  run(repository, ["contract", "sign", contract.id, "--approve"]);
  return contract;
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
  git(repository, "add", ".gitattributes", ".gitignore");
  git(repository, "commit", "-m", "initialize Kotta metadata");
  return repository;
}

describe("contract cancel", () => {
  test("cancels a backlog contract as duplicate into done and validates green", () => {
    const repository = fixture("kotta-cancel-backlog-");
    const original = newContract(repository, "Original work");
    const contract = newContract(repository, "Duplicate work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    const cancelled = run(repository, ["contract", "cancel", contract.id, "--resolution", "duplicate", "--reason", "The same work is already captured", "--superseded-by", original.id, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, command: "contract cancel", data: { id: contract.id, resolution: "duplicate", supersededBy: original.id, claimReleased: false } });

    const done = join(repository, ".kotta/process/done", basename(contract.path));
    expect(existsSync(done)).toBe(true);
    expect(existsSync(contract.path)).toBe(false);
    const content = readFileSync(done, "utf8");
    expect(content).toContain("status: done");
    expect(content).toContain("resolution: duplicate");
    expect(content).toContain("cancellation_reason: The same work is already captured");
    expect(content).toContain(`superseded_by: ${original.id}`);
    expect(run(repository, ["contract", "validate", contract.id])).toMatchObject({ ok: true, data: { id: contract.id, state: "done" } });
  });

  test("retires an active contract superseded by a decision, releasing the claim and keeping the branch", () => {
    const repository = fixture("kotta-cancel-active-");
    const superseding = decision(repository, "Hungarian pages keep Hungarian slugs");
    const contract = definedContract(repository, "Move the Hungarian routes to English slugs");
    run(repository, ["contract", "start", contract.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", contract.id);
    writeFileSync(join(worktree, "route.md"), "# Route\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: start the move");
    const branch = readFileSync(join(repository, ".kotta/process/active", basename(contract.path)), "utf8").match(/^branch: (.+)$/m)?.[1] ?? "";

    const cancelled = run(repository, ["contract", "cancel", contract.id, "--resolution", "obsolete", "--reason", "A decision established the opposite", "--superseded-by", superseding, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, data: { resolution: "obsolete", supersededBy: superseding, claimReleased: true } });

    expect(existsSync(join(repository, ".kotta/process/done", basename(contract.path)))).toBe(true);
    expect(existsSync(join(repository, ".kotta/process/claims", `${contract.id}.yaml`))).toBe(false);
    expect(existsSync(worktree)).toBe(false);
    // The branch is the only copy of whatever was built; close deletes a merged branch, cancel never can.
    expect(git(repository, "branch", "--list", branch).trim()).not.toBe("");
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });

    const summary = String(lifecycleEvents(repository, contract.id).filter((event) => event.kind === "lifecycle").at(-1)?.summary ?? "");
    expect(summary).toContain("from active");
    expect(summary).toContain("resolution obsolete");
    expect(summary).toContain("A decision established the opposite");
    expect(summary).toContain(superseding);
    expect(summary).toContain("claim was released");
    expect(lifecycleEvents(repository, contract.id).some((event) => event.kind === "approval" && event.action === "contract.cancel")).toBe(true);
  });

  test("retires a submitted contract, the exit review did not have", () => {
    const repository = fixture("kotta-cancel-review-");
    const superseding = decision(repository, "The pipeline is replaced wholesale");
    const contract = definedContract(repository, "Extend the deploy pipeline");
    run(repository, ["contract", "start", contract.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", contract.id);
    writeFileSync(join(worktree, "pipeline.md"), "# Pipeline\n");
    git(worktree, "add", ".");
    git(worktree, "commit", "-m", "feat: extend the pipeline");
    run(worktree, ["contract", "review", contract.id, "--evidence", "The pipeline was extended and inspected"]);
    expect(existsSync(join(repository, ".kotta/process/review", basename(contract.path)))).toBe(true);

    const cancelled = run(repository, ["contract", "cancel", contract.id, "--resolution", "obsolete", "--reason", "The work was thrown away after submission", "--superseded-by", superseding, "--approve"]);
    expect(cancelled).toMatchObject({ ok: true, data: { resolution: "obsolete", claimReleased: true } });
    expect(existsSync(join(repository, ".kotta/process/done", basename(contract.path)))).toBe(true);
    expect(existsSync(join(repository, ".kotta/process/claims", `${contract.id}.yaml`))).toBe(false);
    expect(run(repository, ["validate"])).toMatchObject({ ok: true });
  });

  test("refuses an active cancellation with uncommitted work and changes nothing", () => {
    const repository = fixture("kotta-cancel-dirty-");
    const contract = definedContract(repository, "Half-written work");
    run(repository, ["contract", "start", contract.id, "--agent", "codex"]);
    const worktree = join(repository, ".worktrees", contract.id);
    writeFileSync(join(worktree, "draft.md"), "unfinished\n");

    const refused = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("contains uncommitted changes");
    expect(existsSync(join(repository, ".kotta/process/active", basename(contract.path)))).toBe(true);
    expect(existsSync(join(repository, ".kotta/process/claims", `${contract.id}.yaml`))).toBe(true);
    expect(existsSync(worktree)).toBe(true);
    expect(existsSync(join(worktree, "draft.md"))).toBe(true);
  });

  test("retires an active contract whose worktree has vanished", () => {
    const repository = fixture("kotta-cancel-missing-");
    const contract = definedContract(repository, "Stranded work");
    run(repository, ["contract", "start", contract.id, "--agent", "codex"]);
    git(repository, "worktree", "remove", join(repository, ".worktrees", contract.id));

    expect(run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Recovered a stuck execution", "--approve"]))
      .toMatchObject({ ok: true, data: { claimReleased: true } });
    expect(existsSync(join(repository, ".kotta/process/claims", `${contract.id}.yaml`))).toBe(false);
  });

  test("names the contracts that depended on the retired one without cancelling them", () => {
    const repository = fixture("kotta-cancel-dependents-");
    const foundation = newContract(repository, "Foundation");
    const dependent = newContract(repository, "Built on the foundation");
    writeFileSync(dependent.path, readFileSync(dependent.path, "utf8").replace("depends_on: []", `depends_on:\n  - ${foundation.id}`));
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contracts");

    const cancelled = run(repository, ["contract", "cancel", foundation.id, "--resolution", "cancelled", "--reason", "Not building this after all", "--approve"]);
    expect((cancelled as { data: { dependents: string[] } }).data.dependents).toEqual([dependent.id]);
    expect(existsSync(dependent.path)).toBe(true);
  });

  test("refuses a cancellation with no reason, no approval, or an unknown resolution", () => {
    const repository = fixture("kotta-cancel-refusals-");
    const contract = newContract(repository, "Needs approval");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    const unapproved = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "No longer wanted"]);
    expect(unapproved.status).not.toBe(0);
    expect(unapproved.stdout).toContain("Human cancel approval is required");

    const unstated = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "   ", "--approve"]);
    expect(unstated.status).not.toBe(0);
    expect(unstated.stdout).toContain("requires --reason");

    const missingReason = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--approve"]);
    expect(missingReason.status).not.toBe(0);
    expect(missingReason.stderr).toContain("--reason");

    const unknown = fail(repository, ["contract", "cancel", contract.id, "--resolution", "wontfix", "--reason", "Anything", "--approve"]);
    expect(unknown.status).not.toBe(0);
    expect(unknown.stdout).toContain("Cancel resolution must be one of");

    expect(existsSync(contract.path)).toBe(true);
    expect(existsSync(join(repository, ".kotta/process/done", basename(contract.path)))).toBe(false);
  });

  test("refuses a supersession that is unnamed, dangling, or circular", () => {
    const repository = fixture("kotta-cancel-superseded-");
    const contract = newContract(repository, "Superseded work");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");

    const unnamed = fail(repository, ["contract", "cancel", contract.id, "--resolution", "obsolete", "--reason", "Something replaced it", "--approve"]);
    expect(unnamed.status).not.toBe(0);
    expect(unnamed.stdout).toContain("--superseded-by");

    const dangling = fail(repository, ["contract", "cancel", contract.id, "--resolution", "obsolete", "--reason", "Something replaced it", "--superseded-by", "D-404", "--approve"]);
    expect(dangling.status).not.toBe(0);
    expect(dangling.stdout).toContain("names no contract or decision");

    const circular = fail(repository, ["contract", "cancel", contract.id, "--resolution", "duplicate", "--reason", "Itself", "--superseded-by", contract.id, "--approve"]);
    expect(circular.status).not.toBe(0);
    expect(circular.stdout).toContain("cannot supersede itself");

    expect(existsSync(contract.path)).toBe(true);
  });

  test("refuses a second cancellation of a contract already retired", () => {
    const repository = fixture("kotta-cancel-twice-");
    const contract = newContract(repository, "Retired once");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);

    const refused = fail(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Abandoned again", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("already done");
    expect(refused.stdout).toContain("reopen");
  });

  test("a decision shows the contracts it retired", () => {
    const repository = fixture("kotta-cancel-decision-view-");
    const superseding = decision(repository, "Slugs stay as they are");
    const contract = newContract(repository, "Rewrite the slugs");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    run(repository, ["contract", "cancel", contract.id, "--resolution", "obsolete", "--reason", "The decision settled the opposite", "--superseded-by", superseding, "--approve"]);

    const shown = run(repository, ["decision", "show", superseding]) as { data: { superseded: Array<{ id: string; title: string }> } };
    expect(shown.data.superseded).toEqual([{ id: contract.id, title: "Rewrite the slugs" }]);
  });

  test("does not require review evidence for a cancelled done contract but still requires it for completed", () => {
    const repository = fixture("kotta-cancel-evidence-");
    const contract = newContract(repository, "Cancelled path");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "capture contract");
    run(repository, ["contract", "cancel", contract.id, "--resolution", "cancelled", "--reason", "Abandoned", "--approve"]);
    const cancelledPath = join(repository, ".kotta/process/done", basename(contract.path));
    expect(readFileSync(cancelledPath, "utf8")).not.toContain("## Review evidence");
    expect(run(repository, ["contract", "validate", contract.id])).toMatchObject({ ok: true, data: { state: "done" } });

    // A hand-written sequential contract must stay resolvable next to the minted one (D-010).
    const completed = readFileSync(cancelledPath, "utf8")
      .replace(`id: ${contract.id}`, "id: T-901")
      .replace("resolution: cancelled", "resolution: completed")
      .replace(`# ${contract.id}`, "# T-901");
    mkdirSync(join(repository, ".kotta/process/done"), { recursive: true });
    writeFileSync(join(repository, ".kotta/process/done/T-901-completed-path.md"), completed);
    const report = fail(repository, ["contract", "validate", "T-901"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("MISSING_REVIEW_EVIDENCE");
  });
});
