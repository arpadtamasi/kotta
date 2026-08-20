import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

describe("a standalone observation", () => {
  test("is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-observation-standalone-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const commitFixture = (message: string) => {
      execFileSync("git", ["add", "-A"], { cwd: root });
      execFileSync("git", ["commit", "-m", message], { cwd: root });
    };
    commitFixture("fixture: initialised workspace");
    const contract = run(root, ["contract", "new", "--title", "Something to retire", "--type", "fix"]) as { data: { id: string } };
    // 'contract new' does not commit either, so commit it here: this test is about what
    // 'observation new' leaves behind, not about what precedes it.
    commitFixture("fixture: contract new");
    const status = () => execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
    expect(status()).toBe("");

    const created = run(root, ["observation", "new", "--title", "Two writers disagree", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"]) as { data: { id: string; path: string } };

    expect(status()).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: root, encoding: "utf8" }).trim()).toBe(`chore(kotta): capture ${created.data.id}`);
    expect(execFileSync("git", ["show", "--name-only", "--format=", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").sort())
      .toEqual([".kotta/process/index.md", `.kotta/process/observations/new/${basename(created.data.path)}`].sort());

    // 'contract cancel' refuses a dirty control plane, and it is one of the two commands the
    // report saw fail immediately after a successful 'observation new'.
    expect(run(root, ["contract", "cancel", contract.data.id, "--resolution", "cancelled", "--reason", "the fixture no longer needs it", "--approve"])).toMatchObject({ ok: true });
  });
});

describe("observation disposition", () => {
  test("keeps a observation separate until a human resolves it into backlog work", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-observation-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const created = run(root, ["observation", "new", "--title", "Divergent permission checks", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"]) as { ok: boolean; data: { id: string; path: string } };
    expect(created.ok).toBe(true);
    const observationId = created.data.id;
    expect(observationId).toMatch(/^F-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(created.data.path)).toBe(`divergent-permission-checks-${observationId.slice(-8)}.md`);
    expect(run(root, ["observation", "validate", observationId])).toMatchObject({ ok: true });
    const resolved = run(root, ["observation", "resolve", observationId, "--disposition", "create-contract", "--approve"]) as { ok: boolean; data: { contractId: string } };
    expect(resolved.ok).toBe(true);
    const contractId = resolved.data.contractId;
    expect(contractId).toMatch(/^T-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(existsSync(join(root, ".kotta/process/observations/resolved", basename(created.data.path)))).toBe(true);
    const contract = join(root, ".kotta/process/backlog", `divergent-permission-checks-${contractId.slice(-8)}.md`);
    expect(readFileSync(contract, "utf8")).toContain(`source_observation: ${observationId}`);
    expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: root, encoding: "utf8" }).trim()).toBe(`chore(kotta): resolve ${observationId}`);
  });
});
