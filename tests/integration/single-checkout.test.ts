import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

const cli = resolve("dist/cli/index.js");
const HOSTED_SPEC_ID = "GT-01m0c0000000000000000000hs";

function run(cwd: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function fail(cwd: string, args: string[]) {
  return spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/**
 * The reported shape, reproduced as it was measured: one checkout, no linked worktrees, on a branch
 * the environment chose. Before this task, `status` and `task new` both failed here
 * (F-01kztvbpa23qm3gdz4cxkkm5xz).
 */
function hostedRepository(branch = "claude/harness-branch"): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-hosted-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  retainLegacySignGate(root);
  writeFileSync(join(root, ".kotta/spec/glossary-terms/file-exists-000000hs.md"), [
    "---", `id: ${HOSTED_SPEC_ID}`, "form: glossary-term", "title: File exists", "---", "",
    "## Definition", "The file exists.", "", "## Usage", "Hosted task acceptance.", "", "## Non-examples", "A missing file.", "",
  ].join("\n"));
  git(root, "add", ".");
  git(root, "commit", "-m", "initialize Kotta metadata");
  if (branch !== "main") git(root, "checkout", "-b", branch);
  return root;
}

function definition(id: string): string {
  return `---\nid: ${id}\nspec: [${HOSTED_SPEC_ID}]\ncoverage:\n  \"The file exists.\": [${HOSTED_SPEC_ID}]\n---\n# ${id} — Hosted work\n\n## Outcome\n\nThe work is done in the checkout the host provided.\n\n## Scope\n\nOne file.\n\n## Non-goals\n\nNothing else.\n\n## Acceptance\n\n- The file exists.\n\n## Verification\n\n- Read the file.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;
}

describe("a single checkout that is not on the base branch", () => {
  test("runs the whole lifecycle on the branch it was given, creating no second branch or worktree", () => {
    const root = hostedRepository();

    // Both of these failed before: the read-only one for the same reason as the writes.
    const status = run(root, ["status"]) as { data: { controlPlane: { mode: string; branch: string } } };
    expect(status.data.controlPlane).toMatchObject({ mode: "single", branch: "claude/harness-branch" });

    const created = (run(root, ["task", "new", "--title", "Hosted work", "--type", "feature"]) as { data: { id: string; path: string } }).data;
    const source = join(mkdtempSync(join(tmpdir(), "kotta-def-")), "definition.md");
    writeFileSync(source, definition(created.id));
    run(root, ["task", "define", created.id, "--from", source]);
    run(root, ["task", "sign", created.id, "--approve"]);

    const started = run(root, ["task", "start", created.id, "--agent", "codex"]) as { data: { branch: string; origin: string } };
    expect(started.data).toMatchObject({ branch: "claude/harness-branch", origin: "adopted" });

    // Nothing beside what the host laid out: one branch, no worktree directory.
    expect(git(root, "branch", "--list").split("\n").filter((line) => line.trim())).toHaveLength(2); // main and the harness branch
    expect(existsSync(join(root, ".worktrees"))).toBe(false);

    const claim = parse(readFileSync(join(root, ".kotta/process/claims", `${created.id}.yaml`), "utf8")) as Record<string, unknown>;
    expect(claim).toMatchObject({ branch: "claude/harness-branch", worktree: ".", origin: "adopted" });

    writeFileSync(join(root, "delivered.md"), "# Delivered\n");
    git(root, "add", ".");
    git(root, "commit", "-m", "feat: deliver");

    run(root, ["task", "review", created.id, "--evidence", "delivered.md exists and was read"]);
    const closed = run(root, ["task", "close", created.id, "--approve"]) as { data: { adopted: boolean; preserved: { branch: string } } };

    expect(closed.data.adopted).toBe(true);
    expect(closed.data.preserved.branch).toBe("claude/harness-branch");
    // The session's own checkout and branch survive: Kotta removes only what Kotta created.
    expect(git(root, "rev-parse", "--abbrev-ref", "HEAD").trim()).toBe("claude/harness-branch");
    expect(existsSync(join(root, "delivered.md"))).toBe(true);
    expect(existsSync(join(root, ".kotta/process/done", basename(created.path)))).toBe(true);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
  });

  test("cancel leaves the adopted branch and checkout in place", () => {
    const root = hostedRepository();
    const created = (run(root, ["task", "new", "--title", "Hosted work", "--type", "feature"]) as { data: { id: string } }).data;
    const source = join(mkdtempSync(join(tmpdir(), "kotta-def-")), "definition.md");
    writeFileSync(source, definition(created.id));
    run(root, ["task", "define", created.id, "--from", source]);
    run(root, ["task", "sign", created.id, "--approve"]);
    run(root, ["task", "start", created.id, "--agent", "codex"]);

    const cancelled = run(root, ["task", "cancel", created.id, "--resolution", "cancelled", "--reason", "The host moved on", "--approve"]) as { data: { adopted: boolean } };

    expect(cancelled.data.adopted).toBe(true);
    expect(git(root, "rev-parse", "--abbrev-ref", "HEAD").trim()).toBe("claude/harness-branch");
    expect(git(root, "branch", "--list", "claude/harness-branch").trim()).not.toBe("");
  });

  test("on the base branch there is nothing to adopt, so Kotta names and creates as it always has", () => {
    // The ordinary local repository: one checkout, on main. Adoption must not reach it, or every
    // solo developer would be refused a start.
    const root = hostedRepository("main");

    expect(run(root, ["status"])).toMatchObject({ ok: true });
    const created = (run(root, ["task", "new", "--title", "Hosted work", "--type", "feature"]) as { data: { id: string } }).data;
    const source = join(mkdtempSync(join(tmpdir(), "kotta-def-")), "definition.md");
    writeFileSync(source, definition(created.id));
    run(root, ["task", "define", created.id, "--from", source]);
    run(root, ["task", "sign", created.id, "--approve"]);

    const started = run(root, ["task", "start", created.id, "--agent", "codex"]) as { data: { branch: string; origin: string } };

    expect(started.data.origin).toBe("created");
    expect(started.data.branch).toBe(`feat/${created.id}-hosted-work`);
    expect(existsSync(join(root, ".worktrees", created.id))).toBe(true);
    // Execution never lands on the protected branch: the new worktree holds the new branch.
    expect(git(root, "rev-parse", "--abbrev-ref", "HEAD").trim()).toBe("main");
  });

  test("still refuses when several worktrees exist and none is on the base branch", () => {
    const root = hostedRepository("main");
    git(root, "worktree", "add", join(root, "side"), "-b", "side-branch");
    git(root, "checkout", "-b", "another");

    const refused = fail(root, ["status"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout + refused.stderr).toContain("has no checked-out control worktree");
  });
});

describe("git.branch_pattern", () => {
  test("shapes the branch Kotta creates, and the shipped default is unchanged", () => {
    const root = hostedRepository("main");
    // A linked worktree makes this the multi-worktree path, where Kotta names the branch itself.
    git(root, "worktree", "add", join(root, "side"), "-b", "side-branch");

    const created = (run(root, ["task", "new", "--title", "Pattern work", "--type", "feature"]) as { data: { id: string } }).data;
    const source = join(mkdtempSync(join(tmpdir(), "kotta-def-")), "definition.md");
    writeFileSync(source, definition(created.id));
    run(root, ["task", "define", created.id, "--from", source]);
    run(root, ["task", "sign", created.id, "--approve"]);

    const config = join(root, ".kotta/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace('branch_pattern: "{prefix}/{id}-{slug}"', 'branch_pattern: "agent/{slug}-{id}"'));
    git(root, "add", ".");
    git(root, "commit", "-m", "choose a branch pattern");

    const started = run(root, ["task", "start", created.id, "--agent", "codex"]) as { data: { branch: string; origin: string } };
    expect(started.data.origin).toBe("created");
    expect(started.data.branch).toBe(`agent/pattern-work-${created.id}`);
  });

  test("refuses a pattern that renders to a name Git will not accept", () => {
    const root = hostedRepository("main");
    git(root, "worktree", "add", join(root, "side"), "-b", "side-branch");

    const created = (run(root, ["task", "new", "--title", "Bad pattern", "--type", "feature"]) as { data: { id: string } }).data;
    const source = join(mkdtempSync(join(tmpdir(), "kotta-def-")), "definition.md");
    writeFileSync(source, definition(created.id));
    run(root, ["task", "define", created.id, "--from", source]);
    run(root, ["task", "sign", created.id, "--approve"]);

    const config = join(root, ".kotta/config.yaml");
    writeFileSync(config, readFileSync(config, "utf8").replace('branch_pattern: "{prefix}/{id}-{slug}"', 'branch_pattern: "{prefix}/{id}..{slug}"'));
    git(root, "add", ".");
    git(root, "commit", "-m", "choose a bad branch pattern");

    const refused = fail(root, ["task", "start", created.id, "--agent", "codex"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("which Git will not accept");
  });
});
