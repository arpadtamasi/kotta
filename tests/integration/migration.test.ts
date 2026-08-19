import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { sections } from "../../src/core/markdown.js";

describe("legacy migration fidelity", () => {
  test("preserves measured evidence instead of copying the outcome into bug evidence fields", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-migration-source-"));
    const source = join(root, "source");
    const output = join(root, "output");
    mkdirSync(join(source, "scrum/tickets"), { recursive: true });
    writeFileSync(join(source, "scrum/backlog.md"), "# Backlog\n\n## Now\n\n- [O-119 — Slow summary](contracts/O-119-slow-summary.md) — `defined`, bug, **5** points (P0, lane: connector); measured regression.\n\n## Next\n\n## Later\n\n- [O-15 — Duplicate read](contracts/O-15-duplicate-read.md) — `backlog`, other, no estimate (P3, lane: connector); remove the second read.\n");
    writeFileSync(join(source, "scrum/sprint.md"), "# Sprint — evidence-test\n\nStatus: `active`\n\n## Sprint goal\n\nShip the measured performance fix.\n\n## Committed\n\n1. [O-119 — Slow summary](contracts/O-119-slow-summary.md) — 5 SP\n");
    writeFileSync(join(source, "scrum/tickets/O-119-slow-summary.md"), `---
id: O-119
title: Slow summary
lane: connector
type: bug
status: defined
story_points: 5
created_at: 2026-07-21
---

## Outcome

Summary returns in seconds and production can be deployed.

## The production symptom

The deployed request took 96.5 s and 98.1 s, then other users received HTTP 429.

## The measured root cause

One summary took 35,652 ms; evaluating 50 historical takes consumed 31,853 ms.

## Scope

Read stored aggregates instead of rescoring historical takes.

## Out of scope

Do not change the functional recommendation contract.

## Acceptance criteria

Production latency is measured in seconds and the calculated values remain identical.

## Verification

Compare the before and after corpus, then issue a real production request.
`);
    writeFileSync(join(source, "scrum/tickets/O-15-duplicate-read.md"), `---
id: O-15
title: Duplicate read
lane: connector
type: other
status: backlog
created_at: 2026-07-17
---

## Outcome

Use one database read instead of two.

## Why

A measured trace shows the same session document is fetched twice per request.

## Verification

The final implementation issues one read.
`);

    const result = spawnSync("node", [resolve("scripts/migrate-oneanda-demo.mjs"), source, output, "--replace"], { cwd: resolve("."), encoding: "utf8" });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const filename = join(output, ".kotta/process/defined/O-119-slow-summary.md");
    const parsed = matter(readFileSync(filename, "utf8"));
    const body = sections(parsed.content);

    expect(body.get("actual behaviour")).toContain("96.5 s");
    expect(body.get("actual behaviour")).toContain("31,853 ms");
    expect(body.get("actual behaviour")).not.toBe(body.get("outcome"));
    expect(body.get("legacy source contract")).toContain("35,652 ms");
    expect(body.get("legacy source contract")).toContain("HTTP 429");

    const observation = matter(readFileSync(join(output, ".kotta/process/observations/new/O-15-duplicate-read.md"), "utf8"));
    const observationBody = sections(observation.content);
    expect(observationBody.get("evidence")).toContain("fetched twice per request");
    expect(observationBody.get("evidence")).not.toContain("final implementation issues one read");
    expect(observationBody.get("legacy source contract")).toContain("final implementation issues one read");
  });
});
