---
id: EX-01m0f0wn8am4hb2vy03wmn4brs
form: example
title: "An approval leaves a receipt"
subjects:
  - UC-01m0f0wn89p42025mt5vg5012n
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "CHANGELOG.md · 1.0.0-alpha.1 · Added · The planning phase and the one human gate"
  quote: "kotta approve <change> --by <who> records the human's yes, given in the conversation, as approval.yaml, bound to a hash of the delta."
  inferred: "The accepted example closed a task in review, a transition the release removed; the agent restated it for the planning gate, keeping who, when and on what basis, and the counter-cases."
---

## Given

A change, "Add filtered export", whose planning report the operator has read, with no open decision and a model delta that validates.

## When

The calling-chat agent asks: "Land 'Add filtered export' - yes or no?", the operator answers yes, and the agent records it with `kotta approve` naming the operator.

## Then

The change carries `approval.yaml` naming who approved, when, and on what basis - the fingerprint of the delta that was put to the operator - and `kotta archive` lands exactly that delta without asking again. Had the operator stayed silent, answered a different question, or said yes to something else earlier, there would be no receipt and the archive would refuse; had the delta changed after the yes, the archive would refuse it as no longer the one approved.
