import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

describe("kotta init", () => {
  test("creates a valid repository-native workspace", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-init-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: repository });

    const output = execFileSync("node", [cli, "init", "--json"], {
      cwd: repository,
      encoding: "utf8",
    });

    expect(JSON.parse(output)).toMatchObject({ ok: true, command: "init" });
    expect(readFileSync(join(repository, ".kotta/config.yaml"), "utf8")).toContain(
      "base_branch: main",
    );
    expect(readFileSync(join(repository, ".kotta/config.yaml"), "utf8")).toContain("version: 3");
    expect(readFileSync(join(repository, ".kotta/process/index.md"), "utf8")).toContain(
      "Generated file. Do not edit manually.",
    );
    expect(existsSync(join(repository, ".kotta/process/profiles/ui.yaml"))).toBe(true);
    expect(existsSync(join(repository, ".kotta/spec/forms/goal.yaml"))).toBe(true);
    expect(existsSync(join(repository, ".kotta/spec/goals"))).toBe(true);
    expect(readFileSync(join(repository, ".gitattributes"), "utf8")).toContain(".kotta/process/index.md merge=union");
    expect(readdirSync(join(repository, ".kotta")).sort()).toEqual([
      ".kotta-generated.json", "AGENTS.md", "README.md", "config.yaml", "process", "spec",
    ]);
  });
});
