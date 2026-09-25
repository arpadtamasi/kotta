---
id: F-01kzdaxs0133htw4ws8m4rw9a3
title: >-
  Resuming with a different --agent runs the new agent but leaves the claim
  naming the old one
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-existing
resolved_at: '2026-08-07T07:33:52.831Z'
---
# F-01kzdaxs0133htw4ws8m4rw9a3 — Resuming with a different --agent runs the new agent but leaves the claim naming the old one

## Observation

Resuming with a different --agent runs the new agent but leaves the claim naming the old one.

## Evidence

src/commands/execute.ts line 171 resolves the resume agent as options.agent?.trim() || existing.agent. That value drives resolveAgentCommand at line 176 and is passed to runAgent at line 179, so the new agent really runs and appears in the ExecuteResult at line 244. The claim file is never rewritten: the only writer is startContract(id, agent) at line 195, which runs exclusively on the non-resume path. locateExecutionContext at line 113 reads the agent back with String(claim.agent ?? ''), so every later reader - status, board, a subsequent resume that omits --agent - reports the original agent. Reproduced: 'kotta contract execute <id> --resume --agent claude' against a context started with codex leaves .kotta/claims/<id>.yaml at agent: codex, and a later bare --resume silently relaunches codex. The record and the claim disagree about who did the work, and the claim is the canonical one.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
