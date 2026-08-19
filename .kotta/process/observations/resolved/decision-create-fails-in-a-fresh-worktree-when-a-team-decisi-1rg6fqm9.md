---
id: F-01kz1dbnrr9tcghwnr1rg6fqm9
title: decision create fails in a fresh worktree when .a-team/decisions is empty
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-034
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T15:04:38.927Z'
contract: T-01kz1g2vra99x0xhw144x6rke4
---
# F-01kz1dbnrr9tcghwnr1rg6fqm9 — decision create fails in a fresh worktree when .a-team/decisions is empty

## Observation

decision create fails in a fresh worktree when .a-team/decisions is empty.

## Evidence

Git does not carry empty directories into a linked worktree. In a workspace with no recorded decision yet, 'a-team decision create' fails with ENOENT: scandir '<worktree>/.a-team/decisions' (src/commands/decision.ts readdirSync before the duplicate check), while ticket/finding/package writers mkdir their target directory first. Reproduced 2026-08-02: git init + a-team init + git worktree add wt + decision create --approve -> exit 1. Same family as the .a-team/backlog gap fixed inside T-034 for ticket new; decision create is outside T-034's identity contract.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
