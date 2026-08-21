---
id: F-01kz1f399tdejhjwsp1x2fggq8
title: findTicket resolves a merge-duplicated entity to its earliest state copy
status: resolved
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-036
created_at: '2026-08-02'
disposition: merge-duplicate
resolved_at: '2026-08-02T15:04:39.314Z'
---
# F-01kz1f399tdejhjwsp1x2fggq8 — findTicket resolves a merge-duplicated entity to its earliest state copy

## Observation

findTicket resolves a merge-duplicated entity to its earliest state copy.

## Evidence

src/filesystem/entities.ts findTicket() scans TICKET_STATES in lifecycle order and returns the first match, and findPackage() does the same over packages/*. While an entity sits in two state directories after a merge (the T-036 case), every other command — ticket ready/start/review/close, package ready/start, brief, status — therefore operates on the EARLIEST copy, i.e. the stale one, while validate reports DUPLICATE_STATE and dedupe keeps the furthest-advanced one. Observed while building the T-036 fixtures: a ticket present in both ready/ and done/ is still 'ready' to findTicket. T-036 only removes the duplicate; it does not define which copy wins for readers before dedupe runs. Related to but distinct from F-028 (which git context is the truth), which is about worktree vs coordinator, not two copies in one checkout.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
