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
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Node csak kizárt helyen említve"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Az azonosító csak a specifikáció másolatában szerepel"
  quote: "rp, 2026-09-26, chat: exclusions appear beside the none-level nodes and once as a summary in the report head."
  inferred: "Which class each source falls into (an archived model/ as openspec-archive, a generated spec as openspec-spec) was supplied by the agent from the class names in the design."
---

## Given

An accepted node whose id appears in an archived change's `model/` and in a generated narrative spec, and nowhere else.

## When

`kotta gap --json` runs.

## Then

The node is at level `none`, and beside it the report names the excluded classes that mention it — `openspec-archive` and `openspec-spec` — in the field `excluded` —, and the head of the report summarizes the exclusions once.
