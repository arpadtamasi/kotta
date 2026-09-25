---
id: EX-01m3cqmv1hf7skvkcp1jcf80np
form: example
title: "An archived change cites nothing"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Archivált change a repóban"
  quote: "a `gap` és a `modules` jelentés egyetlen node-ot sem sorol be ezek alapján"
---

## Given

A repository where a change was archived: its `model/` copy of the nodes and its `approval.yaml` are committed under `openspec/changes/archive/`, and no code names any of those node ids.

## When

`kotta gap` and `kotta modules` run.

## Then

Neither report places any node on the strength of those files: no node is cited or bound by them, and none is assigned to a module from them.
