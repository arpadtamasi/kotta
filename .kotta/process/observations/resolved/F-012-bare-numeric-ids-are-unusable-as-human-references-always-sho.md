---
id: F-012
title: >-
  Bare numeric IDs are unusable as human references — always show the title
  alongside the id
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-28'
disposition: create-contract
resolved_at: '2026-07-28T08:59:52.645Z'
contract: T-018
---
# F-012 — Bare numeric IDs are unusable as human references — always show the title alongside the id

## Observation

Bare numeric IDs are unusable as human references — always show the title alongside the id.

## Evidence

Live pain (2026-07-28): the operator asked 'T-042 megvan?' and neither operator nor agent could recall what T-042 was — it needed a workspace lookup to learn it is 'Klikk-kimaradás alatt a take ne pontozódjon…' (one&a, status ready, package P-015, from F-001). Bare numeric references (T-042, F-011, D-003) carry no meaning, so every mention forces a lookup. This is the human-reference half of D-003 (identity = ULID, human reference = title) confirmed by real usage. Cheap near-term win, ahead of the full ULID migration: surface the title ALONGSIDE the id everywhere — UI entity rows and the T-017 drawer header, entity-link resolution, generated index/summaries, and how entities are named in chat — as 'T-042 · <title>' (cf. GitHub '#123 title'). Requires no rename; it just stops showing bare numbers. Clusters with the D-003 identity work and strengthens the case for it.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
