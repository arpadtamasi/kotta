---
id: F-01m0psb5eaj8trtxcgpfzgxbw4
title: >-
  kotta validate prints 'completed' while exiting 1, so a red workspace reads as
  green
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-23'
---
# F-01m0psb5eaj8trtxcgpfzgxbw4 — kotta validate prints 'completed' while exiting 1, so a red workspace reads as green

## Observation

kotta validate prints 'completed' while exiting 1, so a red workspace reads as green.

## Evidence

On main@6e41523 'kotta validate' printed 'kotta validate completed.' and exited 1; 'kotta validate --json' reported ok:false with two SPEC_NODE errors. The human render has no case for the validate result (src/cli/index.ts:167-174 falls back to 'kotta <command> completed.'), so only --json or $? carries the failure. The two errors had been red since 2890b57 (2026-08-22) and were reported as clean in three consecutive review submissions.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
