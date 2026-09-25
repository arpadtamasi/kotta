import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

describe("kotta init", () => {
  test("creates a version-6 workspace: the specification and nothing that executes", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-init-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: repository });

    const output = execFileSync("node", [cli, "init", "--json"], {
      cwd: repository,
      encoding: "utf8",
    });

    expect(JSON.parse(output)).toMatchObject({ ok: true, command: "init" });
    const config = readFileSync(join(repository, ".kotta/config.yaml"), "utf8");
    expect(config).toContain("version: 6");
    expect(config).toContain("base_branch: main");
    expect(config).toContain("protected_branches:");
    expect(config).toContain("strict: true");
    // The process configuration is gone with the process.
    for (const key of ["workflow", "agents", "batches", "worktrees", "worktree_root", "branch_pattern", "reject_unknown_profiles", "require_review_evidence_for_done"]) {
      expect(config, `config carries no ${key}`).not.toContain(key);
    }
    expect(existsSync(join(repository, ".kotta/spec/forms/goal.yaml"))).toBe(true);
    expect(existsSync(join(repository, ".kotta/spec/goals"))).toBe(true);
    expect(existsSync(join(repository, ".kotta/process"))).toBe(false);
    expect(existsSync(join(repository, ".kotta/legacy"))).toBe(false);
    expect(existsSync(join(repository, ".gitattributes"))).toBe(false);
    expect(readFileSync(join(repository, ".kotta/README.md"), "utf8")).toContain("version 6");
    expect(readdirSync(join(repository, ".kotta")).sort()).toEqual([
      ".kotta-generated.json", "AGENTS.md", "README.md", "config.yaml", "spec",
    ]);
  });

  test("the fresh workspace validates and is current for every command", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-init-current-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: repository });
    execFileSync("node", [cli, "init", "--json"], { cwd: repository });

    expect(JSON.parse(execFileSync("node", [cli, "validate", "--json"], { cwd: repository, encoding: "utf8" }))).toMatchObject({ ok: true, data: { forms: 11, specNodes: 0 } });
    expect(execFileSync("node", [cli, "migrate", "--dry-run"], { cwd: repository, encoding: "utf8" })).toContain("already on the current shape");
  });
});
