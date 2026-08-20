import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

const cli = resolve("dist/cli/index.js");
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = invoke(cwd, args);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd });

function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-safety-"));
  git(root, "init", "-b", "main"); git(root, "config", "user.name", "Kotta Test"); git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n"); git(root, "add", "."); git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  retainLegacySignGate(root);
  git(root, "add", ".gitattributes", ".gitignore"); git(root, "commit", "-m", "initialize Kotta metadata");
  return root;
}

function completeTemplate(root: string, path: string): void {
  writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", "The result is observable.").replace("- Define an observable condition.", "- The result exists.").replace("- Explain how acceptance will be checked.", "- Run the integration test."));
}

describe("mutation safety", () => {
  test("unknown profiles cannot move a contract out of backlog", () => {
    const root = repository();
    const created = (run(root, ["contract", "new", "--title", "Unsafe contract", "--type", "feature", "--profile", "invented"]) as { data: { id: string; path: string } }).data;
    const backlog = created.path;
    completeTemplate(root, backlog);
    const result = invoke(root, ["contract", "sign", created.id, "--approve"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false });
    expect(existsSync(backlog)).toBe(true);
    expect(existsSync(join(root, ".kotta/process/defined", basename(backlog)))).toBe(false);
  });

  test("dirty repositories and duplicate starts are rejected without reusing a worktree", () => {
    const root = repository();
    const created = (run(root, ["contract", "new", "--title", "Safe start", "--type", "feature"]) as { data: { id: string; path: string } }).data;
    completeTemplate(root, created.path);
    run(root, ["contract", "sign", created.id, "--approve"]);
    writeFileSync(join(root, "dirty.txt"), "pending\n");
    expect(invoke(root, ["contract", "start", created.id, "--agent", "codex"]).status).toBe(1);
    expect(existsSync(join(root, ".worktrees", created.id))).toBe(false);
    unlinkSync(join(root, "dirty.txt"));
    run(root, ["contract", "start", created.id, "--agent", "codex"]);
    expect(invoke(root, ["contract", "start", created.id, "--agent", "other"]).status).toBe(1);
  });
});
