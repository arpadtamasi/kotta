---
id: QA-01m0f0wn8981atnptrbdqa19y2
form: quality-attribute
title: "Bounded brief size"
---

## Source

A contract author - human or agent - preparing work for fresh-context execution.

## Stimulus

Assembling the brief of one contract.

## Environment

Any workspace, any contract state from defined onward.

## Artifact

The contract brief: body, referenced decisions and spec nodes, profiles, claim.

## Response

The brief is deterministic and reports an approximate token count; above the threshold it warns that the contract is probably too large or under-referenced.

## Measure

Default warning threshold 12,000 tokens, configurable per call; the token count is recorded per run. The threshold is a quality gauge on the contract, not a thrift trick.
