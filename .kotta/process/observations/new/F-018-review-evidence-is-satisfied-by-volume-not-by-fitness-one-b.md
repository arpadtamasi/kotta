---
id: F-018
title: >-
  Review evidence is satisfied by volume, not by fitness — one blob is pasted
  into every named check
status: new
origin: agent
observation_type: process
confidence: high
severity: high
discovered_during: null
created_at: '2026-08-01'
---
# F-018 — Review evidence is satisfied by volume, not by fitness — one blob is pasted into every named check

## Observation

Each evidence row in a ticket names a specific check (`ui: visual_evidence_present`, `ui: accessibility_verified`, …). In practice one long prose blob is pasted verbatim into every row. The rows are full, so the gate passes; nothing checks that the text answers the question that row asked.

## Evidence

Measured on the oneanda workspace, tickets closed 2026-07-31 / 08-01:

- The same ~1000-word evidence text appears in **7 separate evidence rows** in T-071, T-074, T-075 and T-076; in 4 rows in T-072, T-073, T-077, T-085, T-089.
- In T-073 the text filed under `ui: visual_evidence_present` literally contains: *"Vizualis evidence valos eszkozon nincs - ejszakai futas."* (No visual evidence on a real device — night run.) The evidence for a check states that the check was not performed, and the ticket passed.

Root cause: the schema requires a non-empty cell per check. An LLM can always produce a non-empty cell. Nothing in the model distinguishes "evidence for this specific claim" from "everything I did on this ticket".

## Impact hypothesis

Review evidence stops being a filter. A reviewer reading fields sees a complete, verified ticket; the actual state can be anything. Combined with [[F-019]] and [[F-020]] this is how a package of green tickets delivers non-working software.

## Confidence

High: directly measurable — identical strings across rows, and one self-contradicting row quoted above.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Cheapest first slice: reject identical text across two evidence rows in the same ticket at validate time. It is a string comparison and it would have caught nine tickets in one workspace.
