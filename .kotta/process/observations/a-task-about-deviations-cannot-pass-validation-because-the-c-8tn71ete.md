---
id: F-01m14gjxmfp1h1fctz8tn71ete
title: >-
  A task about deviations cannot pass validation, because the check reads its
  subject as its confession
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: T-01m1495aj3zx7yhs04cd55hcbs
created_at: '2026-08-28'
---
# F-01m14gjxmfp1h1fctz8tn71ete — A task about deviations cannot pass validation, because the check reads its subject as its confession

## Observation

A task about deviations cannot pass validation, because the check reads its subject as its confession.

## Evidence

kotta validate is red on main at 711e2e5 with DEVIATION_MISMATCH on T-01m1495aj3zx7yhs04cd55hcbs, a task whose subject is the sweep's deviation category. src/core/validation.ts:79-81 fires when the structured Deviations field denies any and the Verification performed narrative contains the word: the line it quoted is that task's own acceptance condition, 'A task that declared a deviation and has no observation naming it is still reported'. The heuristic cannot tell a task reporting its own deviation from a task whose work is about deviations, so writing about the mechanism makes the workspace invalid, and the only exits are to declare a deviation that does not exist or to avoid the word in a task named for it. F-019 introduced the check for a real failure - a field saying None while the narrative admitted one - and this is its cost, showing up the first time a task's subject collided with its vocabulary.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
