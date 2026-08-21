---
id: F-01m0g45rarfc7xdwydn5nn9try
title: Contract review cannot locate a valid moved control-plane worktree
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01m00afb9wt2vrbs3qgrgv0mtw
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:11.854Z'
approved_by: cli
approved_at: '2026-08-21T15:07:11.854Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0g45rarfc7xdwydn5nn9try — Contract review cannot locate a valid moved control-plane worktree

## Observation

Contract review cannot locate a valid moved control-plane worktree.

## Evidence

Submitting T-01m00afb9wt2vrbs3qgrgv0mtw for review failed with 'git status --porcelain failed'. The valid linked worktree is /Users/rp/Dev/progos/kotta-control/.worktrees/T-01m00afb9wt2vrbs3qgrgv0mtw, while reviewContract derives /Users/rp/Dev/progos/kotta/.worktrees/T-01m00afb9wt2vrbs3qgrgv0mtw solely from the current control root and contract id. claim list reports the claim valid, but review cannot use its actual Git worktree location.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
