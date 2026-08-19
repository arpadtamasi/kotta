---
id: F-01kz8wg6jq5tdae6vy0ms18ejw
title: contract validate can pass a backlog contract that sign immediately rejects
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-05'
---
# F-01kz8wg6jq5tdae6vy0ms18ejw — contract validate can pass a backlog contract that sign immediately rejects

## Observation

contract validate can pass a backlog contract that sign immediately rejects.

## Evidence

T-01kz8tk2t53jbax6mrseka50v9: 'kotta contract validate ... --json' returned ok:true in backlog, then 'kotta contract sign ... --approve' rejected the same bytes with OPEN_DECISIONS because defined-state validation is stricter. The operator reports this has happened repeatedly; the advertised pre-sign validation does not predict the sign gate.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
