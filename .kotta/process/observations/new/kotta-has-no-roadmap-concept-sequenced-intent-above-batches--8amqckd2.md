---
id: F-01m0fp0k01d8hy795n8amqckd2
title: Kotta has no roadmap concept - sequenced intent above batches lives nowhere
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0fp0k01d8hy795n8amqckd2 — Kotta has no roadmap concept - sequenced intent above batches lives nowhere

## Observation

Kotta has no roadmap concept - sequenced intent above batches lives nowhere.

## Evidence

Surfaced 2026-08-20 while cutting oneanda's docs/ over to the spec layer. oneanda carries a P1-P6 product-gap roadmap (ordered, human-approved priorities spanning months). In Kotta's model it has no home: a batch is a cause-based group with execution semantics, not an ordered intent list; a goal spec-node needs a measurement and describes an outcome, not a sequence; backlog contracts carry no ordering. The operator's own words: 'a kotta nem beszel roadmaprol'. Open question whether a roadmap is a missing entity, a batch attribute (ordering), or deliberately out of scope (planning stays conversational).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
