---
id: F-01m0jd80fd37cnyvyadm1nqzh6
title: Two schema-required workflow config keys are read by no code
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-21'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:06:43.324Z'
approved_by: cli
approved_at: '2026-08-21T15:06:43.324Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0jd80fd37cnyvyadm1nqzh6 — Two schema-required workflow config keys are read by no code

## Observation

Two schema-required workflow config keys are read by no code.

## Evidence

require_review_evidence_for_done and require_human_done_approval are written by init (src/filesystem/workspace.ts:233,252), required by schemas/config.schema.json, and set true in this workspace's .kotta/config.yaml — but src/core/config.ts parses neither, and no other read site exists in src/. closeTask gates unconditionally, so behaviour is safe, but the operator's config expresses a choice nothing honours, and F-022's premise partly rests on these keys being live. Found during the 2026-08-21 audit.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
