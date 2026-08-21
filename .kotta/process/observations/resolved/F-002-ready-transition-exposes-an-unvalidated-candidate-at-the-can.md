---
id: F-002
title: Ready transition exposes an unvalidated candidate at the canonical ready path
status: resolved
origin: agent
observation_type: race-condition
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-23'
disposition: reject
resolved_at: '2026-07-23T16:49:45.145Z'
---
# F-002 — Ready transition exposes an unvalidated candidate at the canonical ready path

## Observation

Ready transition exposes an unvalidated candidate at the canonical ready path.

## Evidence

src/commands/ticket.ts readyTicket writes the candidate directly to .a-team/ready/<filename>, then calls validateTicketFile(destination, 'ready'), deletes the destination on failure, and only after successful validation unlinks the backlog source. ui/src/App.tsx polls /api/workspace every 1.5 seconds, while readWorkspace reads canonical lifecycle directories without a mutation lock. An isolated reproduction with a non-None Open decisions section confirmed the transition rejects and ultimately preserves only the backlog file, so this did not cause the STAYED IN BACKLOG modal. However, during the synchronous write/validate/delete window a concurrent reader can observe an unvalidated Ready file, and during successful publication can briefly observe both backlog and Ready copies. No outcome-equivalent finding or ticket was found; T-002 covers writer exclusion but explicitly keeps read-only UI reads unlocked.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
