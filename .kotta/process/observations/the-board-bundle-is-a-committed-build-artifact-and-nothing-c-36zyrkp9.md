---
id: F-01m1615epghxzw5g1p36zyrkp9
title: >-
  The board bundle is a committed build artifact, and nothing checks that it
  matches its source
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m160z5twbnc4vr09dzyt7gn2
created_at: '2026-08-29'
---
# F-01m1615epghxzw5g1p36zyrkp9 — The board bundle is a committed build artifact, and nothing checks that it matches its source

## Observation

The board bundle is a committed build artifact, and nothing checks that it matches its source.

## Evidence

ui-dist/ is tracked in git (git ls-files ui-dist returns the bundle; .gitignore lists dist/ and site-dist/ but not ui-dist/) and 'kotta ui' serves it, so a checkout serves the committed bundle rather than the source. Measured today: after correcting ui/src/App.tsx, the tracked bundle still contained the removed 'task sign' string, and the fix was invisible to anyone running the board from the checkout until 'npm run build:ui' was run by hand and the result committed. Nothing in the suite compares the two. The published package is safe by a different mechanism — package.json prepack runs the full build — so the exposure is checkouts, which is where the project's own agents and its board run. This is one layer under F-01m16dp6xspd9kj3d4pe6rqcre: the source can be right while the surface a human sees is stale.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
