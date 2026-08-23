---
id: QA-01m0f0wn8981atnptrbdqa19y2
form: quality-attribute
title: "Bounded brief size"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
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
