---
id: F-01m0fq09grp3qcka6pxqg5ysgq
title: >-
  kotta observation list --status: az opció neve --state, a hibaüzenet jól
  tereli
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0fq09grp3qcka6pxqg5ysgq — kotta observation list --status: az opció neve --state, a hibaüzenet jól tereli

## Observation

kotta observation list --status: az opció neve --state, a hibaüzenet jól tereli.

## Evidence

2026-08-20, oneanda transcript: 'kotta observation list --status new' → error: unknown option '--status' (Did you mean --state?). A javaslat jó, de a --status elég gyakori vendég ahhoz, hogy aliasként megérje elfogadni.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
