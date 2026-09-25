---
id: F-01m0m0kf1k0h23yb0f9xwfetdk
title: The oneanda demo generator still writes the pre-v5 legacy shape
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m0jdnshte2ffyzcp3bhf9kh1
created_at: '2026-08-22'
disposition: accept-risk
resolved_at: '2026-08-22T12:03:58.334Z'
approved_by: cli
approved_at: '2026-08-22T12:03:58.334Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0m0kf1k0h23yb0f9xwfetdk — The oneanda demo generator still writes the pre-v5 legacy shape

## Observation

The oneanda demo generator still writes the pre-v5 legacy shape.

## Evidence

scripts/migrate-oneanda-demo.mjs creates v4 state directories (mkdirSync loop over backlog..batches/done), writes tasks into state directories, uses v3 claim vocabulary (contract:, create_subcontracts) and emits config version: 3. Its output is deliberately a legacy-shape migration preview that kotta migrate carries forward, so the end-to-end flow still works, but any workspace it regenerates is refused by every v5 reader until migrate runs; migration.test.ts asserts the legacy paths it writes.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
