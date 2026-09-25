---
id: F-01m0zn0d24hjbva47xdp1kb6m1
title: >-
  batch start dirties the workspace it just checked, so the first start of a
  clean batch always refuses
status: resolved
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: create-task
resolved_at: '2026-08-27T16:24:17.758Z'
approved_by: cli
approved_at: '2026-08-27T16:24:17.758Z'
approval_basis: 'CLI --approve: observation.resolve'
task: T-01m120jngp2qxx4ma317w38j1q
---
# F-01m0zn0d24hjbva47xdp1kb6m1 — batch start dirties the workspace it just checked, so the first start of a clean batch always refuses

## Observation

batch start dirties the workspace it just checked, so the first start of a clean batch always refuses.

## Evidence

Reproduced on main at 6d1aa13 and on the same code before this session's changes, from a workspace git status --porcelain reports as empty: kotta batch start refuses with 'Repository is dirty. Commit or remove pending changes before starting a task.' The refusal leaves the batch file and process/index.md modified and process/events/<batch>/ untracked; committing that residue and re-running the identical command succeeds. startBatch calls assertClean(root) at its top and passes, so the writes that make it dirty happen after that check and before the first member's task start runs its own assertClean. Every batch therefore needs two invocations to release its first wave, and the operator is told the repository is dirty when it was Kotta that dirtied it.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
