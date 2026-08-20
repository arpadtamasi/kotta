---
id: F-01m0gg40n5m1n9eype3vtxrbbx
title: kotta validate félreérti a történeti DEVIATIONS címsort eltérésként
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: T-01m0fq2zthr89c1qyx6hdkdv3k
created_at: '2026-08-20'
---
# F-01m0gg40n5m1n9eype3vtxrbbx — kotta validate félreérti a történeti DEVIATIONS címsort eltérésként

## Observation

kotta validate félreérti a történeti DEVIATIONS címsort eltérésként.

## Evidence

A v4 workspace migráció után a node dist/cli/index.js validate --json DEVIATION_MISMATCH hibát ad a lezárt T-01kzgn32keps18769dp5rstcgt fájlra, mert a verification narrative 'DEVIATIONS.' címszavát eltérésként értelmezi, miközben a strukturált mező szerint nincs eltérés.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
