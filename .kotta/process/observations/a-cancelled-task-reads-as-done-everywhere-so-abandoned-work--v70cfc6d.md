---
id: F-01m0pvvh2f951cdfwyv70cfc6d
title: >-
  A cancelled task reads as done everywhere, so abandoned work is
  indistinguishable from delivered work
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-23'
---
# F-01m0pvvh2f951cdfwyv70cfc6d — A cancelled task reads as done everywhere, so abandoned work is indistinguishable from delivered work

## Observation

A cancelled task reads as done everywhere, so abandoned work is indistinguishable from delivered work.

## Evidence

After cancelling twelve tasks, 'kotta task list' renders none of them as cancelled (0 lines match '^  cancelled'); each shows 'done'. The frontmatter carries the truth in a separate field — T-001 has status: done, resolution: cancelled — which no list column shows. 'kotta batch status P-001 --json' likewise reports status 'done' with every member 'done', though the batch built nothing and all seven members were retired. One reader-facing consequence: a sweep that distinguishes delivered from abandoned cannot be read back out of the workspace, only out of the commit messages.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
