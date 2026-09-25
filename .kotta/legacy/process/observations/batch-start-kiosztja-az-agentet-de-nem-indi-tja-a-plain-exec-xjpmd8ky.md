---
id: F-01m0fr12kdarqbdcjzxjpmd8ky
title: >-
  batch start kiosztja az agentet, de nem indítja - a plain execute-ot pedig a
  saját claimje utasítja el
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:10.831Z'
approved_by: cli
approved_at: '2026-08-21T15:07:10.831Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fr12kdarqbdcjzxjpmd8ky — batch start kiosztja az agentet, de nem indítja - a plain execute-ot pedig a saját claimje utasítja el

## Observation

batch start kiosztja az agentet, de nem indítja - a plain execute-ot pedig a saját claimje utasítja el.

## Evidence

2026-08-20, ez a workspace: 'kotta batch start P-… --agent claude' claimet, branchet és worktree-t készített (assigned_agent: claude), de headless agentet nem indított. A természetes folytatás, a 'contract execute --agent claude' viszont elutasít: 'already has an execution context … retry inside it with --resume', pedig agent még sosem futott ebben a kontextusban. A működő út a soha-nem-futott contractra is az execute --resume, ami a nevével ellentmond. Vagy a batch start indítsa az executorokat, vagy az execute fogadja el a claim-only állapotot friss indításként.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
