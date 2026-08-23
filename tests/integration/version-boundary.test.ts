import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { WORKSPACE_SCHEMA_VERSION } from "../../src/filesystem/workspace.js";

/**
 * A version boundary refuses in both directions (BR-01m0q89b16xcfasfj1z8mc2hgg,
 * EX-01m0q89b1693yvwzx0j8tr5zjp).
 *
 * The failure this suite pins was reachable from a published release: a Kotta implementing version 5,
 * meeting a workspace recording version 6, called it a legacy shape and named `kotta migrate` — which
 * is exempt from the shape check so that it can read old workspaces, and therefore planned
 * `version: 6 -> 5`. Following the tool's own advice rewrote the newer workspace backwards.
 *
 * The tests drive the built binary because the refusal has to survive the CLI's own preAction hook,
 * which is where the first version of this fix was silently swallowed.
 */

const cli = resolve("dist/cli/index.js");
const NEWER = WORKSPACE_SCHEMA_VERSION + 1;

const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

/** A workspace whose config records `version`, however that compares to what this build implements. */
function fixture(label: string, version: number | string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-boundary-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  const init = attempt(root, ["init", "--json"]);
  if (init.status !== 0) throw new Error(say(init));
  const config = join(root, ".kotta", "config.yaml");
  writeFileSync(config, readFileSync(config, "utf8").replace(/^version: .*$/m, `version: ${version}`));
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "workspace"], { cwd: root });
  return { root, config };
}

/** Commands that read a workspace and are not exempt from the shape check. */
const READERS = [["status"], ["validate"], ["task", "list"], ["observation", "list"], ["gap"]];

describe("a version boundary refuses in both directions", () => {
  test("a newer workspace is refused by every reading command, naming both versions", () => {
    const { root } = fixture("newer", NEWER);
    for (const command of READERS) {
      const result = attempt(root, command);
      const said = say(result);
      expect(result.status, `${command.join(" ")} refuses`).not.toBe(0);
      expect(said, `${command.join(" ")} says which Kotta wrote it`).toContain("written by a newer Kotta");
      expect(said, `${command.join(" ")} names the workspace's version`).toContain(`version ${NEWER}`);
      expect(said, `${command.join(" ")} names this build's version`).toContain(`version ${WORKSPACE_SCHEMA_VERSION}`);
    }
  }, 60_000);

  test("the newer refusal never says legacy and never names migrate", () => {
    const { root } = fixture("wording", NEWER);
    for (const command of [...READERS, ["migrate"], ["migrate", "--dry-run"]]) {
      const said = say(attempt(root, command));
      // Both are true of the other direction and false of this one; either would send the reader to
      // the command that rewrites the workspace backwards.
      expect(said.toLowerCase(), `${command.join(" ")} does not call it legacy`).not.toContain("legacy");
      expect(said, `${command.join(" ")} does not prescribe migrate`).not.toMatch(/kotta migrate/);
    }
  }, 60_000);

  test("migrate refuses a newer workspace and plans nothing", () => {
    const { root, config } = fixture("migrate", NEWER);
    const before = readFileSync(config, "utf8");

    for (const command of [["migrate", "--dry-run"], ["migrate"]]) {
      const result = attempt(root, command);
      const said = say(result);
      expect(result.status, `${command.join(" ")} refuses`).not.toBe(0);
      expect(said).toContain("written by a newer Kotta");
      // A dry run's whole output is its plan; a refusal that still printed one would be the defect.
      expect(said, "no plan is printed").not.toContain("changes planned");
      expect(said, "no downgrade is proposed").not.toContain(`version: ${NEWER}`);
    }
    expect(readFileSync(config, "utf8"), "the config is untouched").toBe(before);
  }, 60_000);

  test("an unreadable version is refused as neither direction", () => {
    const { root } = fixture("unreadable", "{{");
    const said = say(attempt(root, ["status"]));
    expect(said).toContain("does not record a readable workspace shape version");
    expect(said).toContain("config.yaml");
    expect(said.toLowerCase(), "it is not called legacy either").not.toContain("legacy");
  }, 60_000);

  test("an older workspace still refuses the way it always did, and still migrates", () => {
    const { root, config } = fixture("older", WORKSPACE_SCHEMA_VERSION - 1);

    const refusal = say(attempt(root, ["status"]));
    expect(refusal, "the older direction keeps its wording").toContain("uses a legacy Kotta workspace shape");
    expect(refusal, "and keeps naming the remedy").toContain("kotta migrate");

    const planned = say(attempt(root, ["migrate", "--dry-run"]));
    expect(planned, "migrate keeps its exemption in this direction").toContain("changes planned");
    expect(planned).toContain(`version: ${WORKSPACE_SCHEMA_VERSION - 1} → ${WORKSPACE_SCHEMA_VERSION}`);

    expect(attempt(root, ["migrate"]).status, "and carries the workspace forward").toBe(0);
    expect(readFileSync(config, "utf8")).toContain(`version: ${WORKSPACE_SCHEMA_VERSION}`);
    expect(attempt(root, ["status"]).status, "after which it reads normally").toBe(0);
  }, 60_000);
});
