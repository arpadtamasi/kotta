---
id: F-01m0fq095ym137rdhxzf4tcqf7
title: >-
  Observation-rögzítést utasít el a piszkos munkafa, contract-indítós
  hibaüzenettel
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:06:37.733Z'
approved_by: cli
approved_at: '2026-08-21T15:06:37.734Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fq095ym137rdhxzf4tcqf7 — Observation-rögzítést utasít el a piszkos munkafa, contract-indítós hibaüzenettel

## Observation

Observation-rögzítést utasít el a piszkos munkafa, contract-indítós hibaüzenettel.

## Evidence

2026-08-20, growscope-staffing session transcript: az mcp__kotta__observation_create hívás ('A staffing-kérés a jelöltplafon előtt vág…') ezzel tért vissza: 'Repository is dirty. Commit or remove pending changes before starting a contract.' Két hiba egyben: (1) az intake-nek olcsónak kell lennie — egy észrevétel rögzítése evidencia-vesztést kockáztat, ha tiszta munkafát követel, hiszen épp munka közben születik; (2) a hibaüzenet egy másik művelet (contract start) szabályát nevezi meg, tehát a refusal nem a megsértett szabályt mondja. A ma landolt spec szerint a capture a humán vonal első lépése (An observation is not a task); ha ezt a felület eldobja, a tudás a chatben vész el.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
