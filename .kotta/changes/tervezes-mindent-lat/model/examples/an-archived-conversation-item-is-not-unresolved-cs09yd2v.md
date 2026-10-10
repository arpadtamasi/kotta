---
id: EX-01m4kazz5wsg016051cs09yd2v
form: example
title: "An archived conversation item is not unresolved"
subjects:
  - BR-01m4kazyfbvyapfr0h6dcx1n3y
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/tervezes-mindent-lat/conversation.md · SZ2"
  quote: "rp, 2026-10-10: „kezeld a hiákat”"
  inferred: "The gaps were the agent's list after the 2026-10-09 work — the plan missed a clash with an approved open change, the distillate missed the human's answers, the plan reported archived citations as unresolved; the operator asked that they be handled. The remedies are the agent's."
---
# An archived conversation item is not unresolved

## Given

A change that carries over an accepted rule citing `.kotta/changes/hasznalati-eset-hierarchia/conversation.md · SZ2`, archived as `.kotta/changes/archive/2026-10-08-hasznalati-eset-hierarchia/`.

## When

`kotta plan` runs.

## Then

The citation is not listed as unresolved; a citation of a change that is neither open nor archived, or of an item no heading names, still is.

