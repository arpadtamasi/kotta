---
id: F-01kzdhg6mx6ght9h4m504w65gs
title: >-
  A dirty control worktree discards the record of an agent run that already
  completed
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-existing
resolved_at: '2026-08-07T07:33:53.524Z'
---
# F-01kzdhg6mx6ght9h4m504w65gs — A dirty control worktree discards the record of an agent run that already completed

## Observation

A dirty control worktree discards the record of an agent run that already completed.

## Evidence

runAgent launches the agent at src/commands/execute.ts:225 and only afterwards, at line 258, writes the lifecycle event: withControlPlaneMutation(controlRoot, ...) with no requireClean override. src/git/control-plane.ts:94 therefore runs assertClean(controlRoot), which throws 'Repository is dirty. Commit or remove pending changes before starting a contract.' The agent has already run to completion by then, so an unrelated dirty file in the control worktree destroys the record of real work. Observed on T-01kzda6d8qr4yxqcb41yd5vn20, 2026-08-07: a resume ran claude to completion and produced four correct file changes, then exited 1 with that message. No execution event was appended and no state commit was made; the only surviving event remains the earlier no-op run recorded as implemented. The dirt was a single untracked observation file that Kotta itself had just created. Two aggravating details: the message says 'before starting a contract' although nothing was starting, which sends the operator looking in the wrong place; and every sibling caller already passes requireClean: false (src/commands/observation.ts:116, src/commands/conversation.ts:29, src/commands/approval.ts:127 and 157, src/commands/mcp.ts:80, 102, 181), so the execution recorder is the outlier rather than the rule.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
