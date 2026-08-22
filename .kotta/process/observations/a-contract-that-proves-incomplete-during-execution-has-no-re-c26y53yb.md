---
id: F-01kzhna04m3pnghkchc26y53yb
title: >-
  A contract that proves incomplete during execution has no repair path, and the
  gap it is told to record never reaches the executor
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:08.828Z'
approved_by: cli
approved_at: '2026-08-21T15:07:08.828Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kzhna04m3pnghkchc26y53yb — A contract that proves incomplete during execution has no repair path, and the gap it is told to record never reaches the executor

## Observation

A contract that proves incomplete during execution has no repair path, and the gap it is told to record never reaches the executor.

## Evidence

Measured on 2026-08-08 in ezchops/oneanda, contract T-01kzhdb2s5ehvycvr1hdwgmw60. The calling chat started the contract, then offered the human two options: a fresh-context 'execute --resume', or continuing in the current conversation — and said out loud that the fresh run 'nem tudja, amit ma itt kiderítettünk'. The human stopped the run on exactly that ground. Reviewing the conversation against the contract found EIGHT facts present in the chat and absent from the contract. Rule 8 covers this case: record the gap, do not widen your context. Both halves then failed. (1) No repair path. The contract was active; defineContract requires 'backlog', reopenContract requires 'review' or 'done', cancelContract requires 'backlog' or 'defined'. 'claim release --force' removes the claim but leaves the state at active. An active contract's body therefore cannot be revised by any command. (2) The recorded gap is unreachable. briefContract assembles the contract body, its referenced decisions, its profiles and its claim (src/commands/contract.ts) — observations are not included by design. Recording the eight facts as observations would leave the executing agent exactly as uninformed as before. The session resolved it by hand-editing the contract body under .kotta/, with explicit human approval, knowingly breaking the rule that workspace files are never hand-edited. That was the only option that worked. This is the same hole as F-01kzhjhe5t9exnxr4fxvjsfgbq one state further along: there a signed contract could at least be routed backwards through cancel and reopen; from active there is no route at all.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
