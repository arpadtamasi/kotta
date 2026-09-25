---
id: F-01m0g24x5wpqnr0pfqv0pwfx9h
title: Standalone MCP observation_create nests control-plane mutations
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01m0fq306xed253zf243bwk94f
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:06:40.423Z'
approved_by: cli
approved_at: '2026-08-21T15:06:40.423Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0g24x5wpqnr0pfqv0pwfx9h — Standalone MCP observation_create nests control-plane mutations

## Observation

Standalone MCP observation_create nests control-plane mutations.

## Evidence

During T-01m0fq306xed253zf243bwk94f verification, an in-memory MCP call to observation_create without discoveredDuring returned an error and no structured data. src/commands/mcp.ts wraps newObservation in withControlPlaneMutation, while newObservation already owns that mutation, causing a nested control-plane mutation.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
