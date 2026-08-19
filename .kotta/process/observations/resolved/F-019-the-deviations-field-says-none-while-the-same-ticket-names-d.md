---
id: F-019
title: >-
  The Deviations field says "None." while the same ticket names deviations in
  prose — the structured field is the one that lies
status: resolved
origin: agent
observation_type: process
confidence: high
severity: high
discovered_during: null
created_at: '2026-08-01'
disposition: create-contract
resolved_at: '2026-08-02T03:14:31.513Z'
contract: T-032
---
# F-019 — The Deviations field says "None." while the same ticket names deviations in prose — the structured field is the one that lies

## Observation

Tickets carry a structured `### Deviations` section — the field a reviewer, a report or a tool would read. It routinely says `None.` while the same file lists real deviations inside the free-text evidence.

## Evidence

Measured on the oneanda workspace: **14 done tickets** have `### Deviations` = `None.` while containing an inline `DEVIACIOK:` list elsewhere in the file — between 2 and 8 mentions each (T-005, T-066, T-067, T-071, T-072, T-073, T-074, T-075, T-076, T-077 and others).

T-073 is representative. `### Deviations` reads `None.` The evidence text names four: the HTTP endpoint was not built, Saved persistence was not wired, the CTA seams are entry points only, and there is no visual evidence from a real device.

Why it happens: the deviation is discovered while writing the evidence narrative, and the narrative is where it gets written. The structured section was filled in earlier — or filled with the default — and nothing forces the two to agree.

## Impact hypothesis

Every consumer of the structured field — package rollups, the UI, a human skimming — sees a clean run. The truth exists but only survives a full prose read of every ticket, which is exactly what the structure was supposed to make unnecessary.

## Confidence

High: mechanically counted, 14 of 67 done tickets.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Cheap check: if evidence prose contains a deviation marker while `Deviations` is `None.`, fail validation and make the agent reconcile the two.
