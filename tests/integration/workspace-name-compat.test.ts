import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, renameSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { duplicateWorkspaceWarning, hasWorkspace, workspaceDirectoryName } from "../../src/filesystem/workspace.js";

/**
 * `.kotta/` is the workspace directory: `init` creates it and discovery finds it first. The
 * pre-rename `.a-team/` is still discovered so that a workspace under that name can be migrated,
 * and `kotta migrate` is what moves it onto the new name. The `a-team` binary alias is gone with 1.0.
 */

const cli = resolve("dist/cli/index.js");
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version: string; bin: Record<string, string> };

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = invoke(cwd, args);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as { ok: boolean; command: string; data: Record<string, unknown> };
};

/** A committed repository with a version-6 workspace, created by `init` and renamed if asked. */
function repository(label: string, directory = ".kotta"): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-name-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  run(root, ["init"]);
  if (directory !== ".kotta") renameSync(join(root, ".kotta"), join(root, directory));
  git(root, "add", "-A");
  git(root, "commit", "-m", "init");
  return root;
}

describe("the binary name", () => {
  test("package.json publishes kotta alone; the a-team alias left with 1.0", () => {
    expect(Object.keys(packageJson.bin)).toEqual(["kotta"]);
    expect(packageJson.bin.kotta).toBe("dist/cli/index.js");
  });
});

describe("init creates the new workspace directory", () => {
  test("kotta init writes .kotta, and validate is green on it", () => {
    const root = repository("init");
    expect(existsSync(join(root, ".kotta/config.yaml"))).toBe(true);
    expect(existsSync(join(root, ".a-team"))).toBe(false);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
  });

  test("init refuses to add a second workspace beside an existing .a-team", () => {
    const root = repository("refuse", ".a-team");
    const result = invoke(root, ["init"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, errors: [{ message: expect.stringContaining(".a-team already exists") }] });
    expect(existsSync(join(root, ".kotta"))).toBe(false);
  });
});

describe("a workspace under the pre-rename name", () => {
  test("is still discovered, reads, and is moved onto the new name by migrate", () => {
    const root = repository("legacy-name", ".a-team");
    expect(workspaceDirectoryName(root)).toBe(".a-team");
    expect(run(root, ["validate"])).toMatchObject({ ok: true });

    const planned = run(root, ["migrate", "--dry-run"]).data as { changes: Array<{ kind: string; from?: string; to?: string }> };
    expect(planned.changes).toEqual(expect.arrayContaining([{ kind: "move", from: ".a-team", to: ".kotta" }]));
    run(root, ["migrate"]);
    expect(existsSync(join(root, ".kotta/config.yaml"))).toBe(true);
    expect(existsSync(join(root, ".a-team"))).toBe(false);
    expect(workspaceDirectoryName(root)).toBe(".kotta");
  });

  test("a symlinked bridge resolves to the real directory in either direction, and is not ambiguous", () => {
    const bridged = repository("bridge");
    symlinkSync(".kotta", join(bridged, ".a-team"));
    expect(workspaceDirectoryName(bridged)).toBe(".kotta");
    expect(duplicateWorkspaceWarning(bridged)).toBeUndefined();

    const reversed = repository("reversed", ".a-team");
    symlinkSync(".a-team", join(reversed, ".kotta"));
    expect(workspaceDirectoryName(reversed)).toBe(".a-team");
    expect(hasWorkspace(reversed)).toBe(true);
  });

  test("two real directories resolve to .kotta, and the CLI says so on stderr", () => {
    const root = repository("both");
    execFileSync("cp", ["-R", join(root, ".kotta"), join(root, ".a-team")]);
    expect(duplicateWorkspaceWarning(root)).toContain("both .kotta/ and .a-team/ as real directories");
    const result = invoke(root, ["validate"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Kotta uses .kotta/ and ignores .a-team/");
  });
});

describe(".kotta is the primary name", () => {
  test("discovery answers .kotta for a repository that has no workspace yet", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-name-empty-")));
    expect(hasWorkspace(root)).toBe(false);
    expect(workspaceDirectoryName(root)).toBe(".kotta");
  });
});
