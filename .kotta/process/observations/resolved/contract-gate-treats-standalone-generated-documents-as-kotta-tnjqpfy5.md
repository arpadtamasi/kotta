---
id: F-01m007x3gsqznhbcnytnjqpfy5
title: Contract gate treats standalone generated documents as Kotta product work
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-14'
disposition: create-task
resolved_at: '2026-08-14T14:23:04.000Z'
task: T-01m00afb9wt2vrbs3qgrgv0mtw
---
# F-01m007x3gsqznhbcnytnjqpfy5 — Contract gate treats standalone generated documents as Kotta product work

## Observation

Contract gate treats standalone generated documents as Kotta product work.

## Evidence

https://github.com/arpadtamasi/kotta/issues/37 — Kotta 0.5.0 generated rules classify standalone user-requested customer documents as promised deliverables, causing the agent to require a separate Kotta contract even though no governed product or repository change was requested.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
