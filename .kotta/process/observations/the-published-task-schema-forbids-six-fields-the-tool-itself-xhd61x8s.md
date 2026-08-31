---
id: F-01m19wvgyccd54shrsxhd61x8s
title: The published task schema forbids six fields the tool itself writes
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m19v5wx9wd9pf77rdvhtr3s5
created_at: '2026-08-30'
disposition: amend-spec
resolved_at: '2026-08-31T18:55:42.105Z'
approved_by: cli
approved_at: '2026-08-31T18:55:42.105Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - BR-01m0sj2f8mxydc7zxz6y8xn6b1
---
# F-01m19wvgyccd54shrsxhd61x8s — The published task schema forbids six fields the tool itself writes

## Observation

The published task schema forbids six fields the tool itself writes.

## Evidence

schemas/task.schema.json ends with "additionalProperties": false, and declares none of review_commit, branch_origin, start_ref, start_commit, cancellation_reason or superseded_by — all of which src/commands/task.ts writes into task frontmatter (reviewTask, startTask, cancelTask). Read on a live record: 'kotta task show T-01m19v5wx9wd9pf77rdvhtr3s5' prints branch_origin, start_ref and start_commit. Nothing catches it: tests/integration/published-schemas.test.ts checks enums, the version const, and that required fields are defined, but never that a field the code writes is declared — so the check runs one direction only. The schemas are not enforced at runtime (no ajv, no reference from src/validation), so the drift is invisible until someone validates a Kotta task file against the schema Kotta publishes and every recent task fails.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
