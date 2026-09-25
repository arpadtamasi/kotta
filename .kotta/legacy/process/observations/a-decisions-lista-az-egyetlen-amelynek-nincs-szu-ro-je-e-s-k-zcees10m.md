---
id: F-01m01cnbg6zpz76s1szcees10m
title: 'A Decisions lista az egyetlen, amelynek nincs szűrője és keresője'
status: resolved
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-15'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:08:00.028Z'
approved_by: cli
approved_at: '2026-08-21T15:08:00.028Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m01cnbg6zpz76s1szcees10m — A Decisions lista az egyetlen, amelynek nincs szűrője és keresője

## Observation

A Decisions lista az egyetlen, amelynek nincs szűrője és keresője.

## Evidence

A 0.6.0-ba menő board egységesítette a listavezérlőket: az Observations, Contracts és Batches nézet állapotcsipeket és rendezést kapott (ui/src/App.tsx, feat(ui): unify batch trees and list controls). A DecisionsView egyetlen vezérlő nélkül rendereli a teljes listát, és keresés sincs benne — nagyobb workspace-en a döntés csak görgetéssel található meg. Kereső egyébként csak a Contracts nézetben van, a másik háromban nincs.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
