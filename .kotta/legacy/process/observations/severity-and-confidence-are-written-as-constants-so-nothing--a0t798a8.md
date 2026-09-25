---
id: F-01m0ypea8kn7shamp4a0t798a8
title: >-
  Severity and confidence are written as constants, so nothing about them is a
  judgement
status: resolved
origin: human
observation_type: process
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: merge-duplicate
resolved_at: '2026-08-27T16:24:22.901Z'
approved_by: cli
approved_at: '2026-08-27T16:24:22.902Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0ypea8kn7shamp4a0t798a8 — Severity and confidence are written as constants, so nothing about them is a judgement

## Observation

Severity and confidence are written as constants, so nothing about them is a judgement.

## Evidence

Raised by the operator in conversation on 2026-08-26 while triaging F-021. src/commands/observation.ts wrote origin, confidence and severity as literals and 'observation new' had no option for any of them; this task made origin reachable and deliberately left the other two. Measured here: severity is 'medium' on 144 of 150 observations and confidence is 'high' on 149 of 150 - not agents defaulting, but the only values the tool could write. The board offers 'sort by severity' over a column that is 96 percent one value. The open question is whether either field earns its place: nobody has ever been able to supply one, so there is no evidence either way, and both deciding to define them and deciding to remove them would be taste rather than measurement. Now that origin is supplyable, the same experiment can be run: if severity is still unsupplied after the next fifty observations, that is evidence for removing it.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
