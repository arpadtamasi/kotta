import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const BRIEF_SPEC_ID = "GT-01m0c0000000000000000000bf";

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

function fixtureRepository(): { repository: string; id: string } {
  const repository = mkdtempSync(join(tmpdir(), "kotta-brief-"));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  run(repository, ["init"]);
  writeFileSync(join(repository, ".kotta/spec/glossary-terms/export-file-000000bf.md"), [
    "---", `id: ${BRIEF_SPEC_ID}`, "form: glossary-term", "title: Export file", "---", "",
    "## Definition", "Exporter produces a file.", "", "## Usage", "Exporter acceptance.", "", "## Non-examples", "No output.", "",
  ].join("\n"));
  const id = (run(repository, ["contract", "new", "--title", "Ship the exporter", "--type", "feature"]) as { data: { id: string } }).data.id;
  const definition = join(repository, "definition.md");
  writeFileSync(definition, `---
spec: [${BRIEF_SPEC_ID}]
coverage:
  "Exporter produces a file.": [${BRIEF_SPEC_ID}]
---
# ${id} — Ship the exporter

## Outcome

Exports run per D-001 and the missing D-999 is referenced on purpose.

## Scope

One exporter.

## Non-goals

Nothing else.

## Acceptance

- Exporter produces a file.

## Verification

- Run it.

## Constraints

None.

## Open decisions

None.

## Execution notes

None.
`);
  run(repository, ["contract", "define", id, "--from", definition]);
  const decision = join(repository, "D-001-source.md");
  writeFileSync(decision, `---
id: D-001
title: Exporter format is CSV
date: '2026-08-02'
---
# D-001 — Exporter format is CSV

## Decision

CSV, comma-separated.

## Context

Fixture.

## Consequences

None.
`);
  run(repository, ["decision", "create", "--id", "D-001", "--from", decision, "--approve"]);
  return { repository, id };
}

describe("contract brief (T-026 / D-009)", () => {
  test("assembles contract + referenced decisions and reports missing ones", () => {
    const { repository, id } = fixtureRepository();
    const result = run(repository, ["contract", "brief", id]) as { data: Record<string, unknown> };
    const data = result.data as { brief: string; decisions: string[]; missingDecisions: string[]; tokens: number; warning: string | null };
    expect(data.decisions).toEqual(["D-001"]);
    expect(data.missingDecisions).toEqual(["D-999"]);
    expect(data.brief).toContain(`# Execution brief — ${id}`);
    expect(data.brief).toContain("## Contract");
    expect(data.brief).toContain("D-001 — Exporter format is CSV");
    expect(data.brief).toContain("Referenced but not found");
    expect(data.brief).not.toContain("## Observation");
    expect(data.tokens).toBeGreaterThan(0);
    expect(data.warning).toBeNull();
  });

  test("is deterministic: two runs produce identical bytes", () => {
    const { repository, id } = fixtureRepository();
    const first = run(repository, ["contract", "brief", id]) as { data: { brief: string } };
    const second = run(repository, ["contract", "brief", id]) as { data: { brief: string } };
    expect(second.data.brief).toBe(first.data.brief);
  });

  test("warns above the token threshold and names the largest section", () => {
    const { repository, id } = fixtureRepository();
    const result = run(repository, ["contract", "brief", id, "--warn-tokens", "10"]) as { data: { warning: string | null; largestSection: string } };
    expect(result.data.warning).toContain("limit 10");
    expect(result.data.warning).toContain(result.data.largestSection);
  });

  test("writes the brief to a file with --out", () => {
    const { repository, id } = fixtureRepository();
    const out = join(repository, "brief.md");
    const result = run(repository, ["contract", "brief", id, "--out", out]) as { data: { path: string | null } };
    expect(result.data.path).toBe(out);
    expect(readFileSync(out, "utf8")).toContain(`# Execution brief — ${id}`);
  });
});
