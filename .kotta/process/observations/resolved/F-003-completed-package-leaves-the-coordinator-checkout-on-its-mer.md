---
id: F-003
title: Completed package leaves the coordinator checkout on its merged branch
status: resolved
origin: agent
observation_type: workflow-bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-23'
disposition: create-contract
resolved_at: '2026-07-23T17:15:37.776Z'
contract: T-015
---
# F-003 — Completed package leaves the coordinator checkout on its merged branch

## Observation

Completed package leaves the coordinator checkout on its merged branch.

## Evidence

Observed on 2026-07-23: P-002 is done, T-008 and T-009 are done, claims are empty, and no ticket worktrees remain, but the only checkout is still on coord/P-002 at commit 2c6bb1f. Reflog shows an explicit main -> coord/P-002 checkout on 2026-07-22 10:25:59 and no later checkout. origin/main points to merge commit 9c04930 that merged PR #15 from coord/P-002, while local main remains at 71df79d. src/commands/package.ts startPackage requires a non-protected coordinator branch but neither creates nor records its lifecycle. src/commands/ticket.ts closeTicket/updateContainingPackage marks the package done and cleans ticket branches/worktrees but never switches back to config.git.base_branch or cleans the coordinator branch. No claims/worktrees explain retaining the branch. The current worktree is dirty with new P-003 canonical changes, so automatic recovery was intentionally not attempted. No outcome-equivalent finding was found.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
