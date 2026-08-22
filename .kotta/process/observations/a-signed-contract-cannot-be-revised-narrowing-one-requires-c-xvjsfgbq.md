---
id: F-01kzhjhe5t9exnxr4fxvjsfgbq
title: A signed contract cannot be revised; narrowing one requires cancel then reopen
status: resolved
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:07.167Z'
approved_by: cli
approved_at: '2026-08-21T15:07:07.167Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kzhjhe5t9exnxr4fxvjsfgbq — A signed contract cannot be revised; narrowing one requires cancel then reopen

## Observation

A signed contract cannot be revised; narrowing one requires cancel then reopen.

## Evidence

Observed on 2026-08-08 while narrowing T-01kz3kx1ex19tjw82tbd1366pk. A contract in 'defined' has no revision path: defineContract refuses unless the state is 'backlog' (src/commands/contract.ts), and reopenContract refuses unless the state is 'review' or 'done'. The only exits from 'defined' are start/execute or cancel. Narrowing a signed but unstarted contract therefore requires 'cancel --resolution cancelled --approve' followed by 'reopen --approve', which routes the contract through 'done' and records a cancellation the history does not mean. The id and the event chain survive, but the lifecycle log states the contract was retired when it was in fact resized before it ever ran.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
