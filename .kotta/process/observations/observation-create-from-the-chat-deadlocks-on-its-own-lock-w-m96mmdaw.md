---
id: F-01m0ypjk6gzymm0y51m96mmdaw
title: >-
  observation_create from the chat deadlocks on its own lock when no task is
  named
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: reject
resolved_at: '2026-08-27T16:24:23.896Z'
approved_by: cli
approved_at: '2026-08-27T16:24:23.896Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0ypjk6gzymm0y51m96mmdaw — observation_create from the chat deadlocks on its own lock when no task is named

## Observation

observation_create from the chat deadlocks on its own lock when no task is named.

## Evidence

src/commands/mcp.ts wraps the standalone branch in withControlPlaneMutation and calls newObservation inside it; newObservation takes the same repository-scoped lock again in both of its branches (src/commands/observation.ts). The inner acquisition finds the lock held by the outer one and refuses: 'Kotta control plane is busy at <root>. Retry the same command; no state was changed.' Reproduced on 2026-08-26 with an in-memory MCP client calling observation_create with title, type and evidence and no discoveredDuring. Present on main as well, so the chat surface has never been able to capture a standalone observation - the branch with a task works because it is not wrapped. The wrapper adds nothing: newObservation's standalone branch already commits 'chore(kotta): capture <id>'. Found while making origin reachable (T-01m0ypa2rb5xev2g5dsg6c49gx), whose acceptance requires that same chat path to work.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
