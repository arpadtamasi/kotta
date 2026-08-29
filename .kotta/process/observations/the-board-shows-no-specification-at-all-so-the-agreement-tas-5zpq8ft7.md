---
id: F-01m165gwkr13ve210p5zpq8ft7
title: >-
  The board shows no specification at all, so the agreement tasks execute is the
  one thing a reader cannot see
status: new
origin: human
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-29'
---
# F-01m165gwkr13ve210p5zpq8ft7 — The board shows no specification at all, so the agreement tasks execute is the one thing a reader cannot see

## Observation

The board shows no specification at all, so the agreement tasks execute is the one thing a reader cannot see.

## Evidence

Operator, at sight: 'De a spec nincs is rajta.' Measured: src/commands/ui.ts contains no occurrence of 'spec' — the board's data layer never opens .kotta/spec/, so 141 nodes across 11 forms are absent. The board's Task type (ui/src/App.tsx) carries no spec and no coverage field, so a reader cannot see which accepted nodes a task executes or which acceptance condition maps to which — the coverage gate is the product's spine and the board is silent on it. The only trace of the specification anywhere in the board is the observation drawer, which for an amend-spec disposition prints bare ids as code with no title and nothing to open, against the naming rule the operator set. Meanwhile the board still carries a detailed model of a finished import: legacy_ticket_count, migrated_ticket_count, ready_candidate_count, package_count, split_audit, and per-task migration.{legacy_id, lane, story_points, ready_candidate, backlog_section}. The rail names the flow 'Derivation chain: 01 Observations, 02 Tasks, 03 Batches', while the actual chain runs observations to spec to tasks, and amend-spec is the primary constructive disposition. IF-01m0f0wn898ggsdxa0kh6t6tnw lists what the board projects — tasks, observations, batches, runs, per-task timelines — and the specification is not in that list, so this is a gap in the agreement, not only in the code.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
