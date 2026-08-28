---
id: F-01m148re552ezsd5q1js95eyer
title: >-
  A task minted from an observation inherits a symptom for a title, where a task
  title states an outcome
status: new
origin: human
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m148re552ezsd5q1js95eyer — A task minted from an observation inherits a symptom for a title, where a task title states an outcome

## Observation

A task minted from an observation inherits a symptom for a title, where a task title states an outcome.

## Evidence

Reported from a project on 2026-08-27: two tasks created by the create-task disposition carry their observation's title verbatim, one of them reading 'OAuth AS state (clients, codes, tokens) is stored in-memory...'. Measured here: src/commands/observation.ts:165 mints the task with title: String(entity.data.title) - the observation's own. The two kinds say opposite things by construction: an observation states a symptom, and a task states the outcome that ends it, so inheriting one as the other produces a backlog of complaints rather than of work. Definition can retitle before execution, and in that project defining is a human gate (allow_agent_defined_tasks: false), so the wrong title is temporary - but it is what the operator reads in every listing until then, and this session's naming work removed the id that used to sit beside it, so the title now carries the whole identity. The reporting agent declined to fix it by hand because process/ is Kotta-owned, which is correct.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
