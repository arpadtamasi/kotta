---
id: F-01m14vswkyez6x7kerqtt5twrk
title: >-
  A command summarised as validation promotes a batch and commits, and nothing
  in its description says so
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m14mgyrv00b7ye5r3pvh2bdf
created_at: '2026-08-28'
---
# F-01m14vswkyez6x7kerqtt5twrk — A command summarised as validation promotes a batch and commits, and nothing in its description says so

## Observation

A command summarised as validation promotes a batch and commits, and nothing in its description says so.

## Evidence

src/core/operations.ts:48 summarises workspace.validate as 'Validate every record in the workspace.' Running it calls validateBatch for every batch (src/commands/validate.ts), which on a valid backlog batch writes the file, regenerates the index, appends a lifecycle event and calls commitControlState (src/commands/batch.ts). Measured: migrate's new validation step made 'kotta migrate' commit the whole working tree, breaking tests/integration/task-vocabulary-compat.test.ts at its own 'git commit' because nothing was left to commit. The transition is intended (SM-01m0f0wn89m2xwd4z4mk9p71d5) and so is the commit (F-01m0zn0d24hjbva47xdp1kb6m1); what is missing is that any caller or operator reading 'validate' learns it writes.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
