import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

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
    retainLegacySignGate(root);
    git(root, "add", ".gitattributes", ".gitignore"); git(root, "commit", "-m", "initialize Kotta metadata");
    const created = (run(root, ["contract", "new", "--title", "Document flow", "--type", "documentation"]) as { data: { id: string; path: string } }).data;
    const id = created.id;
    const filename = basename(created.path);
    const path = created.path;
    writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", "The flow is documented.").replace("- Define an observable condition.", "- Documentation describes the flow.").replace("- Explain how acceptance will be checked.", "- Read the rendered documentation."));
    run(root, ["contract", "sign", id, "--approve"]);
    run(root, ["contract", "start", id, "--agent", "codex"]);
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "flow.md"), "# Flow\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "docs: document flow");

    expect(run(worktree, ["contract", "review", id, "--evidence", "flow.md renders and was inspected", "--pull-request", "PR-1"])).toMatchObject({ ok: true, command: "contract review" });
    git(root, "merge", "--no-ff", `docs/${id}-document-flow`, "-m", "merge contract");
    const pending = join(worktree, "pending.txt");
    writeFileSync(pending, "uncommitted\n");
    const refused = spawnSync("node", [cli, "contract", "close", id, "--approve", "--json"], { cwd: root, encoding: "utf8" });
    expect(refused.status).toBe(1);
    expect(existsSync(join(root, ".kotta/process/review", filename))).toBe(true);
    expect(existsSync(join(root, ".kotta/process/claims", `${id}.yaml`))).toBe(true);
    unlinkSync(pending);
    expect(run(root, ["contract", "close", id, "--approve"])).toMatchObject({ ok: true, command: "contract close" });

    expect(existsSync(join(root, ".kotta/process/done", filename))).toBe(true);
    expect(existsSync(join(root, ".kotta/process/claims", `${id}.yaml`))).toBe(false);
    expect(existsSync(worktree)).toBe(false);
    expect(git(root, "branch", "--list", `docs/${id}-document-flow`).trim()).toBe("");
  });
});
