import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

describe("review and close", () => {
  test("records evidence, merges, and safely releases execution resources", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-close-"));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    writeFileSync(join(root, "README.md"), "fixture\n");
    git(root, "add", "."); git(root, "commit", "-m", "initial");
    run(root, ["init"]);
    acceptFixtureSpec(root);
    git(root, "add", ".gitattributes", ".gitignore"); git(root, "commit", "-m", "initialize Kotta metadata");
    const created = (run(root, ["task", "new", "--title", "Document flow", "--type", "documentation"]) as { data: { id: string; path: string } }).data;
    const id = created.id;
    const path = created.path;
    run(root, ["task", "define", id, "--from", coveredDefinition(path, { outcome: "The flow is documented.", acceptance: ["Documentation describes the flow."], verification: "Read the rendered documentation." })]);
    run(root, ["task", "start", id, "--agent", "codex"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "flow.md"), "# Flow\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "docs: document flow");

    expect(run(worktree, ["task", "review", id, "--evidence", "flow.md renders and was inspected", "--pull-request", "PR-1"])).toMatchObject({ ok: true, command: "task review" });
    git(root, "merge", "--no-ff", `docs/${id}-document-flow`, "-m", "merge task");
    const pending = join(worktree, "pending.txt");
    writeFileSync(pending, "uncommitted\n");
    const refused = spawnSync("node", [cli, "task", "close", id, "--approve", "--json"], { cwd: root, encoding: "utf8" });
    expect(refused.status).toBe(1);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toMatch(/^status: review$/m);
    expect(existsSync(join(root, ".kotta/process/claims", `${id}.yaml`))).toBe(true);
    unlinkSync(pending);
    expect(run(root, ["task", "close", id, "--approve"])).toMatchObject({ ok: true, command: "task close" });

    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toMatch(/^status: done$/m);
    expect(existsSync(join(root, ".kotta/process/claims", `${id}.yaml`))).toBe(false);
    expect(existsSync(worktree)).toBe(false);
    expect(git(root, "branch", "--list", `docs/${id}-document-flow`).trim()).toBe("");
  });
});
