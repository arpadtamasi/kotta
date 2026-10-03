import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import type { MigrateResult } from "../../src/commands/migrate.js";

/**
 * The pre-1.0 heritage is gone (BR-01m413z0y4dtjs9rs718bdnm4j, BR-01m0q89b16xcfasfj1z8mc2hgg): Kotta
 * finds a workspace only as `.kotta/`, refuses a pre-1.0 one in every command, and `migrate` only
 * moves changes out of OpenSpec's folder — which `kotta-changes.test.ts` measures.
 */

const cli = resolve("dist/cli/index.js");
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => JSON.parse(execFileSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" })) as { ok: boolean; data: unknown };

function repository(label: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-migrate-${label}-`)));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  return root;
}

describe("the pre-1.0 heritage is gone", () => {
  test("a pre-rename workspace is not found, and migrate renames nothing (EX-01m413z1x8vsfp6jncykrshbtc)", () => {
    const root = repository("a-team");
    run(root, ["init"]);
    renameSync(join(root, ".kotta"), join(root, ".a-team"));
    const validated = invoke(root, ["validate"]);
    expect(validated.status).toBe(1);
    expect(`${validated.stdout}${validated.stderr}`).toContain("No .kotta workspace");
    expect(invoke(root, ["migrate"]).status).not.toBe(0);
    expect(existsSync(join(root, ".a-team"))).toBe(true);
    expect(existsSync(join(root, ".kotta"))).toBe(false);
  });

  test("the refusal is by shape, not by version alone: a version-6 config beside a process/ directory is still old", () => {
    const root = repository("shape-not-version");
    run(root, ["init"]);
    mkdirSync(join(root, ".kotta/process/tasks"), { recursive: true });
    for (const command of [["validate"], ["migrate"]]) {
      const result = invoke(root, command);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(".kotta/process/");
      expect(result.stderr).toContain("@arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate");
    }
  });

  test("the old commands are gone, not merely refused: task, batch, observation, decision, claim, status and sweep", () => {
    const root = repository("gone");
    run(root, ["init"]);
    for (const command of ["task", "batch", "observation", "decision", "claim", "status", "sweep"]) {
      const result = invoke(root, [command]);
      expect(result.status, `${command} exists`).not.toBe(0);
      expect(result.stderr).toContain(`unknown command '${command}'`);
    }
    const help = invoke(root, ["--help"]).stdout;
    expect(help).toContain("migrate");
    // The 0.x approval surface is gone; `approve` is back only as the planning phase's one gate.
    expect(help).not.toMatch(/^\s{2}approval\b/m);
    expect(help).toMatch(/^\s{2}approve \[options\] <change>\s+Record the human's yes/m);
  });
});

describe("Kotta's own workspace", () => {
  test("is on the current shape: spec/ validates, and migrate has nothing to do", () => {
    // A local clone proves the shape that ships: the specification validates, and `migrate` finds no
    // change left in OpenSpec's folder. An old `legacy/` folder, where one is left, is a plain folder.
    const clone = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-self-")));
    execFileSync("git", ["clone", "--local", "--no-hardlinks", "--quiet", resolve("."), clone]);
    execFileSync("git", ["checkout", "-B", "main", "--quiet"], { cwd: clone });
    expect(existsSync(join(clone, ".kotta/process"))).toBe(false);
    expect(readFileSync(join(clone, ".kotta/config.yaml"), "utf8")).toContain("version: 6");
    expect(run(clone, ["validate"])).toMatchObject({ ok: true });
    expect((run(clone, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
  }, 180_000);
});
