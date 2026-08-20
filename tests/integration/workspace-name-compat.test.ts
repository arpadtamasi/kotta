import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";
import { readWorkspace } from "../../src/commands/ui.js";
import { duplicateWorkspaceWarning, hasWorkspace, workspaceDirectoryName } from "../../src/filesystem/workspace.js";

/**
 * `.kotta/` is the primary workspace directory (T-021 / D-007): `init` creates it and discovery finds
 * it first. The rename still may not cost an existing workspace anything: `.a-team/` keeps working
 * untouched, the `a-team` binary name keeps working, and a symlink bridges the two directory names in
 * either direction. Two real directories are the one ambiguous case, and the CLI says so out loud.
 * Every claim here is exercised, not asserted.
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

/** A committed repository with a workspace under `directory`, created by `init` and renamed if needed. */
function repository(label: string, directory = ".kotta"): string {
  // realpath, so the board takes its git base-ref path: `git rev-parse --show-toplevel` reports the
  // resolved directory, and a mismatch would silently fall back to plain working-tree reads.
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-compat-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  run(root, ["init"]);
  retainLegacySignGate(root);
  // An existing workspace predates the rename: it is the `.a-team` directory `init` no longer writes.
  if (directory !== ".kotta") renameSync(join(root, ".kotta"), join(root, directory));
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  return root;
}

function completeTemplate(path: string): void {
  writeFileSync(path, readFileSync(path, "utf8")
    .replace("Describe the observable outcome.", "The result is observable.")
    .replace("- Define an observable condition.", "- The result exists.")
    .replace("- Explain how acceptance will be checked.", "- Run the integration test."));
}

/** backlog → defined, the shortest path that reads, writes, moves files and regenerates the index. */
function contractRoundTrip(root: string, directory: string): { id: string; path: string } {
  const created = run(root, ["contract", "new", "--title", "Compatibility contract", "--type", "feature"]).data as { id: string; path: string };
  expect(created.path).toContain(`${directory}/process/backlog`);
  completeTemplate(created.path);
  run(root, ["contract", "sign", created.id, "--approve"]);
  expect(existsSync(join(root, directory, "process", "defined", basename(created.path)))).toBe(true);
  expect(readFileSync(join(root, directory, "process", "index.md"), "utf8")).toContain(basename(created.path).replace(/\.md$/, ""));
  const status = run(root, ["status"]).data as { definedContracts: string[] };
  expect(status.definedContracts).toContain(created.id);
  expect(run(root, ["validate"])).toMatchObject({ ok: true });
  return { id: created.id, path: join(root, directory, "process", "defined", basename(created.path)) };
}

describe("both binary names", () => {
  test("package.json publishes kotta and keeps a-team pointing at the same entrypoint", () => {
    expect(packageJson.bin.kotta).toBe("dist/cli/index.js");
    expect(packageJson.bin["a-team"]).toBe(packageJson.bin.kotta);
  });

  test("both linked names report the same version", () => {
    // What `npm i -g` does with the bin map: one symlink per name into a directory on PATH.
    const bin = mkdtempSync(join(tmpdir(), "kotta-compat-bin-"));
    for (const name of Object.keys(packageJson.bin)) symlinkSync(cli, join(bin, name));
    const versions = Object.keys(packageJson.bin).map((name) => execFileSync(join(bin, name), ["--version"], { encoding: "utf8" }).trim());
    expect(versions).toEqual([packageJson.version, packageJson.version]);
    expect(new Set(versions).size).toBe(1);
  });
});

describe("init creates the new workspace directory", () => {
  test("kotta init writes .kotta, and validate is green on it", () => {
    const root = repository("init");
    expect(existsSync(join(root, ".kotta/config.yaml"))).toBe(true);
    expect(existsSync(join(root, ".a-team"))).toBe(false);
    expect(readFileSync(join(root, ".gitattributes"), "utf8")).toContain(".kotta/process/index.md merge=union");
    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });
  });

  test("init refuses to add a second workspace beside an existing .a-team", () => {
    const root = repository("init-legacy", ".a-team");
    const result = invoke(root, ["init"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(".a-team already exists");
    expect(existsSync(join(root, ".kotta"))).toBe(false);
  });
});

describe("an existing .a-team workspace keeps working untouched", () => {
  test("the full backlog → defined round trip runs inside .a-team and creates no .kotta", () => {
    const root = repository("legacy", ".a-team");
    contractRoundTrip(root, ".a-team");
    expect(existsSync(join(root, ".kotta"))).toBe(false);
    expect(workspaceDirectoryName(root)).toBe(".a-team");
  });

  test("the board reads a .a-team workspace through git", () => {
    const root = repository("legacy-ui", ".a-team");
    const created = run(root, ["contract", "new", "--title", "Board contract", "--type", "feature"]).data as { id: string };
    git(root, "add", ".");
    git(root, "commit", "-m", "contract");
    const board = readWorkspace(root);
    expect(board.workspace).toBe(join(root, ".a-team"));
    expect(board.contracts.map((contract) => contract.id)).toContain(created.id);
  });
});

describe("a symlink bridges the two directory names", () => {
  test(".kotta → .a-team: the new name reaches an existing workspace, writes still land in .a-team", () => {
    const root = repository("link-new-to-old", ".a-team");
    symlinkSync(".a-team", join(root, ".kotta"));

    const contract = contractRoundTrip(root, ".a-team");
    // The link is a link, not a copy: nothing was migrated behind the operator's back.
    expect(lstatSync(join(root, ".kotta")).isSymbolicLink()).toBe(true);
    expect(readdirSync(join(root, ".kotta/process/defined"))).toEqual(readdirSync(join(root, ".a-team/process/defined")));

    git(root, "add", ".");
    git(root, "commit", "-m", "contract");
    // Git plumbing sees `.kotta` as a link entry, so the board must resolve to the real tree.
    // Deleting the file from the working tree proves which side answered: only the ref-side read —
    // `git archive` of the resolved directory, which a symlink entry could not have produced — survives it.
    rmSync(contract.path);
    const board = readWorkspace(root);
    expect(board.workspace).toBe(join(root, ".a-team"));
    expect(board.contracts).toHaveLength(1);
    expect(readWorkspace(join(root, ".kotta")).contracts).toHaveLength(1);
  });

  test(".a-team → .kotta: pre-rename scripts and paths keep resolving after a project moves over", () => {
    const root = repository("link-old-to-new");
    symlinkSync(".kotta", join(root, ".a-team"));

    contractRoundTrip(root, ".kotta");
    expect(lstatSync(join(root, ".a-team")).isSymbolicLink()).toBe(true);
    expect(readdirSync(join(root, ".a-team/process/defined"))).toEqual(readdirSync(join(root, ".kotta/process/defined")));

    git(root, "add", ".");
    git(root, "commit", "-m", "contract");
    const board = readWorkspace(root);
    expect(board.workspace).toBe(join(root, ".kotta"));
    expect(board.contracts).toHaveLength(1);
    expect(readWorkspace(join(root, ".a-team")).contracts).toHaveLength(1);
  });

  test("two real directories resolve to .kotta, and the CLI says so on stderr", () => {
    const root = repository("both");
    renameSync(join(root, ".kotta"), join(root, ".a-team"));
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    execFileSync("cp", ["-R", join(root, ".a-team"), join(root, ".kotta")]);
    expect(workspaceDirectoryName(root)).toBe(".kotta");
    expect(readWorkspace(root).workspace).toBe(join(root, ".kotta"));

    // Acceptance 4 (D-007): ambiguity is never silent. The warning goes to stderr, so `--json`
    // stdout stays parseable, and it names the winner, the ignored directory and the way out.
    const result = invoke(root, ["status"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain(".kotta/ and .a-team/ as real directories");
    expect(result.stderr).toContain("uses .kotta/ and ignores .a-team/");
    expect(result.stderr).toContain("ln -s .kotta .a-team");
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    // Once per process, not once per path join.
    expect(result.stderr.match(/contains both/g)).toHaveLength(1);
  });

  test("a symlinked bridge is not the ambiguous case and stays silent", () => {
    const linked = repository("quiet-link");
    symlinkSync(".kotta", join(linked, ".a-team"));
    expect(duplicateWorkspaceWarning(linked)).toBeUndefined();
    expect(invoke(linked, ["status"]).stderr).toBe("");

    const single = repository("quiet-single", ".a-team");
    expect(duplicateWorkspaceWarning(single)).toBeUndefined();
    expect(invoke(single, ["status"]).stderr).toBe("");
  });
});

describe(".kotta is the primary name", () => {
  test("discovery answers .kotta for a repository that has no workspace yet", () => {
    const empty = realpathSync(mkdtempSync(join(tmpdir(), "kotta-compat-empty-")));
    expect(workspaceDirectoryName(empty)).toBe(".kotta");
    expect(hasWorkspace(empty)).toBe(false);
  });

  test("a fresh workspace is discovered under the new name and nothing points at the old one", () => {
    const root = repository("primary");
    expect(workspaceDirectoryName(root)).toBe(".kotta");
    expect(readWorkspace(root).workspace).toBe(join(root, ".kotta"));
    const status = run(root, ["status"]).data as { workspace?: string };
    expect(status.workspace).toBe(join(root, ".kotta"));
  });
});

describe("environment overrides", () => {
  test("the pre-rename A_TEAM_ variable is still honoured beside KOTTA_", async () => {
    const { readEnv } = await import("../../src/core/env.js");
    expect(readEnv("AGENT_COMMAND", { A_TEAM_AGENT_COMMAND: "legacy" })).toBe("legacy");
    expect(readEnv("AGENT_COMMAND", { KOTTA_AGENT_COMMAND: "current" })).toBe("current");
    expect(readEnv("AGENT_COMMAND", { KOTTA_AGENT_COMMAND: "current", A_TEAM_AGENT_COMMAND: "legacy" })).toBe("current");
  });
});
