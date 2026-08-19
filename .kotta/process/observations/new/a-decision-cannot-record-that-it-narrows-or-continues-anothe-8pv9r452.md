---
id: F-01kz20h7kvbk1s8drg8pv9r452
title: >-
  A decision cannot record that it narrows or continues another, so the board
  can only guess from prose
status: new
origin: agent
observation_type: product
confidence: high
severity: medium
discovered_during: T-01kz1xrxw4aheeqv1ca0bv0fcq
created_at: '2026-08-02'
---
# F-01kz20h7kvbk1s8drg8pv9r452 — A decision cannot record that it narrows or continues another, so the board can only guess from prose

## Observation

A decision cannot record that it narrows or continues another, so the board can only guess from prose.

## Evidence

The Kotta Console v2 design draws Decisions as blocks: single decisions, plus a chain ('one decision in three widening steps') with per-item relations 'opens the chain' / 'continues D-005' / 'current extent', and a 'narrowed by D-010' warning on the decision that a later one limits. The data cannot carry any of it: src/core/decision.ts accepts exactly three frontmatter fields (id, title, date) and three sections (Decision, Context, Consequences), and rejects anything else ('Unsupported decision fields'). D-010 narrows D-003 only in a Hungarian sentence inside its Decision section. T-01kz1xrxw4aheeqv1ca0bv0fcq therefore ships a flat, newest-first list that shows 'reads with <title>' for every other D- id it finds in the prose — a mention, not a relation, and it cannot tell narrowing from continuation or citation. Reading a narrowed decision alone still gives the wrong answer, which is the exact failure D-010 was written to prevent.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
