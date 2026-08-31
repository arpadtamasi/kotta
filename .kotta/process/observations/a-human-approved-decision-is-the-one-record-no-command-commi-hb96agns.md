---
id: F-01m1bbbby1bhzrxj3yhb96agns
title: A human-approved decision is the one record no command commits
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m1bb1fhe0fsmk05swhscx62j
created_at: '2026-08-31'
---
# F-01m1bbbby1bhzrxj3yhb96agns — A human-approved decision is the one record no command commits

## Observation

A human-approved decision is the one record no command commits.

## Evidence

src/commands/decision.ts writes the record with writeFileSync and never calls commitControlState or withControlPlaneMutation — it is the only creating command that does not. task new, task define, observation new, batch new, batch add, observation link and the whole task lifecycle all commit their own record. Reproduced on 2026-08-31 in a clean fixture: 'kotta decision create --from d.md --approve' reports 'Recorded decision …' and 'git status --porcelain' then shows '?? .kotta/process/decisions/'. The record carries a human's approval receipt, and canonical live state is the base branch (AGENTS.md), so until some later command happens to sweep it up the board cannot see it, a fresh clone does not have it, and 'kotta validate' passes without it. Found while proving that every read-declared operation leaves the workspace untouched: the fixture's baseline was dirty, and this was why.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
