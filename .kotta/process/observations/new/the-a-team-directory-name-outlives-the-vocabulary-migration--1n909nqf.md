---
id: F-01kz294xzzcswpmkg91n909nqf
title: The .a-team directory name outlives the vocabulary migration with no end date
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-023
created_at: '2026-08-02'
---
# F-01kz294xzzcswpmkg91n909nqf — The .a-team directory name outlives the vocabulary migration with no end date

## Observation

The .a-team directory name outlives the vocabulary migration with no end date.

## Evidence

T-023 treats the pre-vocabulary STATE directories (ready/, findings/, packages/) as the old shape that every command refuses, but leaves the workspace DIRECTORY name .a-team readable, because D-007/T-020 decided that and three test files (tests/unit/core.test.ts, tests/integration/ui-data.test.ts, tests/integration/ui-batch-read.test.ts) deliberately fixture it. kotta migrate moves a real .a-team onto .kotta, so after the neighbour migration no workspace needs the alias — yet workspace.ts keeps WORKSPACE_DIRECTORIES, duplicateWorkspaceWarning and the symlink handling alive, and the README still documents the bridge. Nothing decides when that read is removed.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
