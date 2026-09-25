---
id: F-01m144jsf1nqhmt9v4a1g16nc7
title: The gap ratchet meets a spec-first project as a wall on its first day
status: resolved
origin: human
observation_type: risk
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
disposition: amend-spec
resolved_at: '2026-08-28T13:32:44.773Z'
approved_by: cli
approved_at: '2026-08-28T13:32:44.773Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - BR-01m0qtshfqhcrrqtz051zm9svr
---
# F-01m144jsf1nqhmt9v4a1g16nc7 — The gap ratchet meets a spec-first project as a wall on its first day

## Observation

The gap ratchet meets a spec-first project as a wall on its first day.

## Evidence

Two projects reported on 2026-08-27, both after landing a specification before the code that implements it: one 'kotta gap elbukik: 59 specifikacios igerethez nem talal implementacios bizonyitekot', the other '221 specigeretnel nem talal repository evidence-et'. Measured here on a fresh workspace with three glossary terms and no implementation: gap reports 'Promises without evidence: 3' and exits 1. The ratchet is calibrated for a repository whose specification grew alongside its code, where an unevidenced promise is news. Kotta's own workshops encourage the opposite order - shape the agreement first, then execute it - so a project that follows the advice is refused by the tool on day one, and its only exit is to admit every node one at a time. The admission kinds exist for inherited nodes; nothing distinguishes 'nobody has looked' from 'this was written five minutes ago and the work has not started'.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
