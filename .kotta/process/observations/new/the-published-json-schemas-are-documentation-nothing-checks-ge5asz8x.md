---
id: F-01kz294y2ev4068xsnge5asz8x
title: The published JSON schemas are documentation nothing checks
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-023
created_at: '2026-08-02'
---
# F-01kz294y2ev4068xsnge5asz8x — The published JSON schemas are documentation nothing checks

## Observation

The published JSON schemas are documentation nothing checks.

## Evidence

schemas/*.json ship in package.json files[] and are referenced by scripts/verify-pack.mjs, but no code path loads or validates against them: validation is hand-written in core/validation.ts, commands/validate.ts and core/claim.ts. During T-023 the schemas had to be edited by hand alongside the validators (kind removed from batch.schema.json, version const bumped to 2, every field renamed) and nothing would have failed if they had been forgotten. Two independent definitions of the same shape drift silently.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
