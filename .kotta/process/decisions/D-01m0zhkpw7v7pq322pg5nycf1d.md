---
id: D-01m0zhkpw7v7pq322pg5nycf1d
title: Batch parallelism bounds how many members run at once
date: '2026-08-26'
approved_by: cli
approved_at: '2026-08-26T17:24:14.343Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m0zhkpw7v7pq322pg5nycf1d — Batch parallelism bounds how many members run at once

## Decision

A batch's `parallelism` is the number of its members that may be executing at the same time, not
the number a single wave release may start. Releasing a wave counts what the batch already holds:
members that are already claimed occupy the budget until they leave it.

## Context

`kotta batch start` capped only the members it released in that invocation. Measured on 2026-08-26
with four independent defined tasks and `--parallelism 2`, two consecutive releases with nothing
finished in between left four tasks active, four claims and four worktrees; the same run reported
the two it had left running as `Waiting:`. Both readings of the word were defensible from the code,
so the question was put to the operator rather than answered by the implementation that happened to
exist: `Run a batch` says the batch "releases the first wave within the configured parallelism",
which reads as a bound on the batch, and the operator confirmed that reading.

## Consequences

The wave release counts active members against the budget, so a second release with nothing
finished starts nothing and says so. A batch cannot exceed its configured parallelism by being
started twice, which is what the setting exists to prevent: an operator who sets 2 is stating how
much concurrent work this repository can carry, not how large one keystroke's effect may be. The
report stops calling running work waiting. Nothing about which member is eligible changes; only how
many of the eligible are released.
