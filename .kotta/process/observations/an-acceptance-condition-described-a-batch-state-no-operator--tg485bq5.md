---
id: F-01m0zpg89ydwy8q0ygtg485bq5
title: >-
  An acceptance condition described a batch state no operator can reach, and the
  deviation that declared it has no record of its own
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: create-task
resolved_at: '2026-08-27T16:24:22.166Z'
approved_by: cli
approved_at: '2026-08-27T16:24:22.166Z'
approval_basis: 'CLI --approve: observation.resolve'
task: T-01m120jsvqwswpkdvhdz0jhh5j
---
# F-01m0zpg89ydwy8q0ygtg485bq5 — An acceptance condition described a batch state no operator can reach, and the deviation that declared it has no record of its own

## Observation

An acceptance condition described a batch state no operator can reach, and the deviation that declared it has no record of its own.

## Evidence

T-01m0jdntvbbp5rbj6t2eqpd0tg's third acceptance condition ended 'and a batch whose members are all done still says so'. Closing the last member completes the batch, so batch start refuses on the state before that branch of startBatch can report anything: the sentence names a path no operator can take, and the No tasks were dispatched line it describes is unreachable through the command. The task shipped with the reachable half covered and the sentence declared as a deviation at review; this records what the deviation left behind. Two questions follow: whether that reporting branch should be removed as dead, and whether defining should be able to tell an acceptance condition that no state satisfies from one that is merely unproven.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
