---
id: F-01m0t75ff4eg3nm0gtwg7qqm4b
title: >-
  After a bulk spec edit the delta section lists the entire specification as the
  latest landing
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-24'
---
# F-01m0t75ff4eg3nm0gtwg7qqm4b — After a bulk spec edit the delta section lists the entire specification as the latest landing

## Observation

After a bulk spec edit the delta section lists the entire specification as the latest landing.

## Evidence

On the branch at 550ffc6, 'kotta gap' shows 107 entries under '## Latest accepted spec delta' because kinding every admission touched every node. The section exists so a fresh landing leads the report ('A fresh landing is checked delta-first' in UC-01m0fpqfxjvet99wbz0v1ag64q); when the delta is the whole specification it says nothing and implies 107 new agreements. Noticed while fixing the repetition in T-01m0t6y6mrz2qv285gqfanyvza, and left alone as outside its scope.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
