---
id: F-01m0g6hsgby0yb89zrrgyj9wyh
title: Review submission has no per-check evidence input for duplicate validation
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m0fq318dpmktbc2jtv3d65m7
created_at: '2026-08-20'
---
# F-01m0g6hsgby0yb89zrrgyj9wyh — Review submission has no per-check evidence input for duplicate validation

## Observation

Review submission has no per-check evidence input for duplicate validation.

## Evidence

During T-01m0fq318dpmktbc2jtv3d65m7, reviewContract accepts one evidence string and writes that same string into every acceptance/profile check row (src/commands/contract.ts). CLI exposes one --evidence value and MCP schemas evidence as one string. The task requires distinct evidence per named check to continue working, but no current input can express that mapping; choosing a new public CLI/MCP representation is product intent absent from the execution brief.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
