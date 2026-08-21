---
id: F-01m0fjrkdk7wx4jjz0jk7q3pec
title: >-
  An older CLI silently downgrades a newer-shaped workspace instead of refusing
  it
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:08:04.237Z'
approved_by: cli
approved_at: '2026-08-21T15:08:04.237Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fjrkdk7wx4jjz0jk7q3pec — An older CLI silently downgrades a newer-shaped workspace instead of refusing it

## Observation

An older CLI silently downgrades a newer-shaped workspace instead of refusing it.

## Evidence

Observed live on the oneanda workspace (config version: 3, spec/process namespaces, written by kotta@main). A published kotta 0.5.0 resolved from a different nvm global prefix ran 'contract review' against it: instead of refusing the unknown newer shape, it reported zero entities everywhere (status: Defined 0, active 0, review 0), wrote a flat-shape .kotta/index.md into the workspace root, and rewrote config.yaml version: 3 -> 2. The migrate guard only covers OLDER shapes ('every other command refuses a pre-vocabulary workspace'); a FUTURE config version passes silently. Expected: any command meeting a workspace config version above what the CLI knows refuses with a named error (upgrade the CLI), writes nothing. The published 0.6.0 behaves the same way on the nested shape (zeros, no refusal).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
