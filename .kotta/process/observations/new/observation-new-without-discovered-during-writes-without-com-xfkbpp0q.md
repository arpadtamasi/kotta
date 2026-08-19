---
id: F-01kzhjhsknj52aqr4mxfkbpp0q
title: >-
  'observation new' without --discovered-during writes without committing and
  blocks the next command
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
---
# F-01kzhjhsknj52aqr4mxfkbpp0q — 'observation new' without --discovered-during writes without committing and blocks the next command

## Observation

'observation new' without --discovered-during writes without committing and blocks the next command.

## Evidence

Observed on 2026-08-08 in this repository. newObservation (src/commands/observation.ts:25-36) takes two paths: with --discovered-during it runs inside withControlPlaneMutation, appends a lifecycle event and calls commitControlState; without it, it calls writeObservation directly and does neither. A standalone observation therefore leaves the control worktree dirty with an untracked observation file and a modified index.md. The next lifecycle command then refuses: 'kotta contract cancel' and 'kotta contract reopen' both failed with 'Repository is dirty. Commit or remove pending changes before starting a contract.' immediately after a successful 'observation new'. Kotta's own uncommitted write blocks Kotta's next command, and the recovery is a hand-run git commit of state files the tool is supposed to own.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
