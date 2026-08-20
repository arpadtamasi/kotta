import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

describe("workspace reference validation", () => {
  test("rejects dependencies and blockers that are absent from the current task graph", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-dangling-reference-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("node", [cli, "init", "--json"], { cwd: root });
    const created = JSON.parse(execFileSync("node", [cli, "task", "new", "--title", "Release beta", "--type", "feature", "--json"], { cwd: root, encoding: "utf8" })) as { data: { path: string } };
    const taskPath = created.data.path;
    writeFileSync(
      taskPath,
      readFileSync(taskPath, "utf8")
        .replace("depends_on: []", "depends_on:\n  - T-999")
        .replace("blocks: []", "blocks:\n  - O-404"),
    );

    const result = spawnSync("node", [cli, "validate", "--json"], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: "DANGLING_REFERENCE", message: expect.stringContaining("depends_on references missing task T-999") }),
        expect.objectContaining({ code: "DANGLING_REFERENCE", message: expect.stringContaining("blocks references missing task O-404") }),
      ]),
    });
  });
});
