import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

describe("kotta validate", () => {
  test("names a node whose edge points at nothing, and passes once the reference resolves", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-validate-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("node", [cli, "init", "--json"], { cwd: root });
    const goal = "G-01m0c0000000000000000000g1";
    writeFileSync(join(root, ".kotta/spec/use-cases/export-00000uc1.md"), [
      "---", "id: UC-01m0c0000000000000000000c1", "form: use-case", "title: Export a report", "actor: []", `goal: [${goal}]`, "---", "",
      "## Intent", "Export.", "", "## Preconditions", "None.", "", "## Main success scenario", "It exports.", "", "## Alternatives", "None.", "",
    ].join("\n"));

    const dangling = spawnSync("node", [cli, "validate", "--json"], { cwd: root, encoding: "utf8" });
    expect(dangling.status).toBe(1);
    expect(JSON.parse(dangling.stdout)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: "SPEC_NODE_DANGLING_EDGE", message: expect.stringContaining(goal) }),
        expect.objectContaining({ code: "SPEC_NODE_MISSING_EDGE", message: expect.stringContaining("actor") }),
      ]),
    });
    // The human rendering names the failure rather than printing a completed line.
    const human = spawnSync("node", [cli, "validate"], { cwd: root, encoding: "utf8" });
    expect(human.status).toBe(1);
    expect(human.stdout).toContain("kotta validate failed with");
    expect(human.stdout).not.toContain("The specification validates");
  });
});
