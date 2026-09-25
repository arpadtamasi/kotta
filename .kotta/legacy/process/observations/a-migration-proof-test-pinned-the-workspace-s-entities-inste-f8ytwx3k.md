---
id: F-01m0zeac76djkj1jm6f8ytwx3k
title: >-
  A migration-proof test pinned the workspace's entities instead of the
  property, so writing any new question broke it
status: resolved
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: reject
resolved_at: '2026-08-27T16:24:24.885Z'
approved_by: cli
approved_at: '2026-08-27T16:24:24.885Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0zeac76djkj1jm6f8ytwx3k — A migration-proof test pinned the workspace's entities instead of the property, so writing any new question broke it

## Observation

A migration-proof test pinned the workspace's entities instead of the property, so writing any new question broke it.

## Evidence

tests/integration/questions.test.ts:190 asserted asking.every(name => name.startsWith('T-025-')). Landed with T-024 on 2026-08-26; broke the same day, the first time a second entity was given an open question (the batch-waves capture, 41cdd41), with 'expected false to be true' and no indication of which entity or why. Fixed forward in the same session by asserting the property the test is named for - an entity is listed as asking exactly when its own section says something other than a denial - read from an independent split of the file rather than from the parse under test.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
