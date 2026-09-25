---
id: EX-01m3cqmvs23cfzrxwfjpvk80dx
form: example
title: "A node named only in an excluded source says which"
capability: evidence
subjects:
  - BR-01m3cqmtfyrpdzcppvy0565652
  - BR-01m0qtshfqhcrrqtz051zm9svr
  - UC-01m0fpqfxjvet99wbz0v1ag64q
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Node csak kizárt helyen említve"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Az azonosító csak a specifikáció másolatában szerepel"
  quote: "a node `none` szintű, és a jelentés a node mellett megnevezi, melyik kizárt forrás-osztály említi"
  inferred: "Which class each source falls into (an archived model/ as openspec-archive, a generated spec as openspec-spec) was supplied by the agent from the class names in the design."
---

## Given

An accepted node whose id appears in an archived change's `model/` and in a generated narrative spec, and nowhere else.

## When

`kotta gap --json` runs.

## Then

The node is at level `none`, and beside it the report names the excluded classes that mention it — `openspec-archive` and `openspec-spec`.
