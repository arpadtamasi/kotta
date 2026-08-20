---
id: QA-01m0f0wn8981atnptrbdqa19y2
form: quality-attribute
title: "Bounded brief size"
---

## Source

A task author - human or agent - preparing work for fresh-context execution.

## Stimulus

Assembling the brief of one task.

## Environment

Any workspace, any task state from defined onward.

## Artifact

The task brief: body, referenced decisions and spec nodes, profiles, claim.

## Response

The brief is deterministic and reports an approximate token count; above the threshold it warns that the task is probably too large or under-referenced.

## Measure

Default warning threshold 12,000 tokens, configurable per call; the token count is recorded per run. The threshold is a quality gauge on the task, not a thrift trick.
