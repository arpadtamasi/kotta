---
id: F-01kzdaxefyc4jxk1hwe3z74k41
title: >-
  The executor discards the agent stdout it captured, so no run records what the
  agent claimed
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-existing
resolved_at: '2026-08-07T07:33:52.493Z'
---
# F-01kzdaxefyc4jxk1hwe3z74k41 — The executor discards the agent stdout it captured, so no run records what the agent claimed

## Observation

The executor discards the agent stdout it captured, so no run records what the agent claimed.

## Evidence

src/commands/execute.ts captures agent stdout at line 84 into AgentRun.stdout (type at line 36) and uses it exactly once, at line 234, as the emptiness test !run.stdout.trim(). The doc comment at line 62 states that intent outright: 'its stdout is captured because an empty result is a failure.' ExecuteResult.data (lines 118-141) has no stdout field, so the captured text is dropped when the promise settles. The lifecycle event appended at line 257 carries only a generic reason string. Consequence: after a run there is no stored trace of what the agent reported about its own work - no summary, no claimed changes, no self-reported failures. Diagnosing a suspicious run requires probing the worktree separately, which is how this was found. Note stderr is treated differently: it is forwarded live to process.stderr at line 87, so it is visible during the run but equally unpersisted afterwards.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
