---
id: F-01kzhnkbpdfc2v4bste7bbdr58
title: >-
  'claim release --force' strands the contract in active with no command able to
  act on it
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
disposition: create-task
resolved_at: '2026-08-20T07:47:31.359Z'
task: T-01m0f27cwtzc2dbgv24ctjgjm8
---
# F-01kzhnkbpdfc2v4bste7bbdr58 — 'claim release --force' strands the contract in active with no command able to act on it

## Observation

'claim release --force' strands the contract in active with no command able to act on it.

## Evidence

Verified in src/ on 2026-08-08, and hit in ezchops/oneanda on contract T-01kzhdb2s5ehvycvr1hdwgmw60. releaseClaim (src/commands/claim.ts:30-46) deletes the claim and commits, but never touches the contract's state: the contract stays 'active' with no claim and no execution context. Every command then refuses it. startContract requires 'defined' (src/commands/contract.ts:129). executeContract requires 'defined' (src/commands/execute.ts:186). 'execute --resume' requires an execution context, which is the claim that was just deleted (src/commands/execute.ts:175 and locateExecutionContext). reopenContract requires 'review' or 'done'. cancelContract requires 'backlog' or 'defined'. The contract is reachable by nothing. releaseClaim is the documented inverse of start — start moves defined to active and writes the claim — but it undoes only half of that, and the CLI offers no second half. The only exit observed was hand-editing 'status: active' back to 'defined' in the frontmatter, which the rules forbid. This is distinct from F-01kzhtr1qam4bkzz1kdc26y53yb: that one is about a contract whose text is wrong, this one is about a contract whose state no command accepts, and it is reached by a supported recovery command doing exactly what it documents.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
