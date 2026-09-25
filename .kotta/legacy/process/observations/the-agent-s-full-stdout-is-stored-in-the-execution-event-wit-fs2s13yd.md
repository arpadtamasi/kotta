---
id: F-01kzhm8vrbt4kgc3bwfs2s13yd
title: The agent's full stdout is stored in the execution event with no size bound
status: resolved
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
disposition: reject
resolved_at: '2026-08-21T15:06:04.979Z'
approved_by: cli
approved_at: '2026-08-21T15:06:04.979Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kzhm8vrbt4kgc3bwfs2s13yd — The agent's full stdout is stored in the execution event with no size bound

## Observation

The agent's full stdout is stored in the execution event with no size bound.

## Evidence

Found on 2026-08-08 while reviewing T-01kzdhtqw01nbgdg5dd9cw3zpr. runAgent stores the run's captured stdout verbatim in the execution event payload as agent_report.output (src/commands/execute.ts). Capturing it is an improvement — it was discarded before — but nothing bounds, truncates or summarises it. The whole output of a verbose run lands in one JSON file under .kotta/events/, and because .kotta/ is version-controlled and committed by commitControlState, it enters the Git history permanently. A single long agent run can therefore add hundreds of kilobytes to the repository that no later command can prune.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
