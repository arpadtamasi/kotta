---
id: EX-01m3cqmvdeqkvkbdzwnbfdzwzz
form: example
title: "A project's own specs directory still holds tests"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 1. Egy szűrő, egy szabály"
    - "openspec/changes/bizonyitek-csak-kodbol/tasks.md · 1.1"
  quote: "a projekt saját `specs/` könyvtára jogosan lehet teszt"
  inferred: "The concrete path and the expected level were supplied by the agent from the design's reason for not using a path pattern."
---

## Given

A project keeps its own tests under `specs/` outside `openspec/`, and one of them names an accepted node by its id.

## When

`kotta gap` runs.

## Then

That file still counts as a test and the node is evidenced by it: the exclusion follows the specification sources Kotta knows, not the directory name.
