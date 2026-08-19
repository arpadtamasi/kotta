---
id: F-031
title: >-
  Harom lezart ticket hordozza az F-019 mintat sajat magaban: T-026, T-029,
  T-030 Deviations mezoje None, a prozajuk DEVIACIO-t sorol
status: resolved
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-032
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T09:55:59.258Z'
contract: T-033
---
# F-031 — Harom lezart ticket hordozza az F-019 mintat sajat magaban: T-026, T-029, T-030 Deviations mezoje None, a prozajuk DEVIACIO-t sorol

## Observation

Harom lezart ticket hordozza az F-019 mintat sajat magaban: T-026, T-029, T-030 Deviations mezoje None, a prozajuk DEVIACIO-t sorol.

## Evidence

A T-032-ben bevezetett DEVIATION_MISMATCH szabaly a sajat repon harom done ticketet jelol: T-026 (DEVIACIO-1, DEVIACIO-2), T-029 (DEVIACIOK: base-branch +1 git status, ...), T-030 (DEVIACIOK: +1 orszem-teszt ismeretlen resolutionre). Mindharomban a strukturalt szakasz 'None.', a narrativa deviaciot nevesit — pontosan az F-019 mintaja. A T-032 non-goal-ja kizarta a visszamenoleges szovegjavitast, ezert a workspace 'a-team validate' futasa jelenleg harom DEVIATION_MISMATCH hibaval piros. Ket ut van: a harom ticket Deviations mezojet a sajat prozajukbol kibekiteni (szoveg-javitas, nem kod), vagy a szabalyt a jovobeli lezarasokra korlatozni egy datum-hatarral.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
