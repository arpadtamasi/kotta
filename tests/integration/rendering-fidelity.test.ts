import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A rendering never claims more than the result carries. `kotta validate` once printed
 * `kotta validate completed.` while exiting 1, which left specification errors red across three
 * submissions that cited the command as clean. These tests drive the built binary in both
 * renderings, because the defect lived only in the one a human reads.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });

function brokenWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-rendering-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  // A glossary term missing a required section: exactly the kind of error that used to print as completed.
  writeFileSync(join(root, ".kotta/spec/glossary-terms/half-00000gt1.md"), [
    "---", "id: GT-01m0c0000000000000000000t1", "form: glossary-term", "title: Half a term", "---", "",
    "## Definition", "Defined.", "",
  ].join("\n"));
  return root;
}

describe("a rendering never claims more than the result carries", () => {
  test("a failed validation is not printed as completed (EX-01m0pw5bc716gdz5qbb8yv6t2m)", () => {
    const root = brokenWorkspace();
    const result = attempt(root, ["validate"]);
    expect(result.status).toBe(1);
    expect(result.stdout).not.toContain("completed");
    expect(result.stdout).not.toContain("The specification validates");
    expect(result.stdout).toContain("kotta validate failed with 2 errors");
    expect(result.stdout).toContain("SPEC_NODE_MISSING_SECTION");
    expect(result.stdout).toContain("Usage");
    expect(result.stdout).toContain("Non-examples");
  });

  test("the human rendering and --json never disagree about the outcome (EX-01m0pw5bc716gdz5qbb8yv6t2m)", () => {
    const root = brokenWorkspace();
    const human = attempt(root, ["validate"]);
    const json = attempt(root, ["validate", "--json"]);
    const parsed = JSON.parse(json.stdout) as { ok: boolean; errors: Array<{ code: string }> };
    expect(parsed.ok).toBe(false);
    expect(human.status).toBe(json.status);
    for (const error of parsed.errors) expect(human.stdout).toContain(error.code);
  });

  test("a passing validation says what it measured", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-rendering-ok-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("node", [cli, "init", "--json"], { cwd: root });
    const result = attempt(root, ["validate"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("The specification validates: 0 nodes across 11 forms.");
  });
});
