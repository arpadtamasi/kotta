---
id: F-01m14khpxg95vz68nc2ba65js0
title: >-
  Stripping the acceptance condition was not enough: the evidence command names
  the word too
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m14khpxg95vz68nc2ba65js0 — Stripping the acceptance condition was not enough: the evidence command names the word too

## Observation

Stripping the acceptance condition was not enough: the evidence command names the word too.

## Evidence

kotta validate is red again on main at 517c84b, DEVIATION_MISMATCH against T-01m14j3afm6f2mqagd11zjbvw2 - the task that fixed the previous instance of this. Its evidence line reads '<condition>: run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "own subject is deviations"'. The fix landed hours earlier strips the acceptance condition before scanning, correctly; what remains is the run: command, which names a test file and a filter about deviations. A declared command is machine evidence, executed and receipted at submission - it is not an agent's account of the run, which is what F-019's check exists to read. The fix was right about where the false positive came from and incomplete about how far it reached, and the case that proves it is the task that made it.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
