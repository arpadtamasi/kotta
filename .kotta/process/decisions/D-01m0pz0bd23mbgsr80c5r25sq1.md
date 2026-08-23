---
id: D-01m0pz0bd23mbgsr80c5r25sq1
title: Ranking goes toward risk reduction
date: '2026-08-23'
approved_by: cli
approved_at: '2026-08-23T09:25:10.183Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m0pz0bd23mbgsr80c5r25sq1 — Ranking goes toward risk reduction

## Decision

When two pieces of open work compete for the next execution slot, the one that reduces risk is taken first. Risk here means the chance that Kotta reports something other than what is true, or that a later change lands on a foundation nobody has proved. A capability that makes the tool more trustworthy outranks a capability that makes it larger, and both outrank a capability that only makes it nicer.

## Context

The owner's standing instruction, given 2026-08-23 in response to a choice between repairing Kotta's own reporting and taking the head of the backlog: always toward risk reduction.

It was asked for after a sweep found the concrete case. Three defects had the same shape: the tool's human-readable output claimed more than its own result carried, while the machine-checked evidence beside it was true. `kotta validate` printed `completed` while exiting 1, which left two specification errors red across three consecutive review submissions that cited it as clean; and twelve just-retired tasks were indistinguishable from eighty-nine delivered ones. Nothing in the backlog was worth more than making the tool's own reports trustworthy, because every later receipt is read through them.

The owner's attention is the scarce resource, and an hour spent on a feature built over an unverified foundation may have to be spent again. Kotta's whole claim is that a promise is worth what its evidence is worth; a backlog ranked by appetite rather than by risk would contradict the product at the level of how it is built.

## Consequences

- The agent proposes the next execution by risk, not by size and not by the order the backlog was written, and says which risk the proposal reduces.
- A defect in how Kotta reports its own state outranks a new capability by default.
- Foundation work — state, evidence, derivation, reporting — is scheduled before work that builds on it, even when the built-on work is more visible.
- This does not license widening a task's scope. A risk noticed inside an execution is still an observation; the ranking applies between tasks, never within one.
- The owner may override the ranking for any single choice. This records the default, not a rule the human is bound by.
