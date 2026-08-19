---
id: F-01kz294gmp94tmevyf3hcysj58
title: >-
  migration.json keeps the pre-vocabulary words, and nothing decides when it
  stops
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-023
created_at: '2026-08-02'
---
# F-01kz294gmp94tmevyf3hcysj58 — migration.json keeps the pre-vocabulary words, and nothing decides when it stops

## Observation

migration.json keeps the pre-vocabulary words, and nothing decides when it stops.

## Evidence

After T-023 the only place in the code that still says tickets/findings/packages is the legacy import artefact migration.json: ui.ts reads migration?.tickets and the key list [tickets, findings, excluded_terminal], and scripts/migrate-oneanda-demo.mjs writes them. Freezing them was deliberate (an already-imported workspace must stay readable) but no decision records when the file is dropped or rewritten, and kotta migrate does not touch it. A reader who greps for the old vocabulary finds these and cannot tell whether they are leftovers or contract.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
