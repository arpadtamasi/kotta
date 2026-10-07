---
id: EX-01m0f0wn8am4hb2vy03wmn4brs
form: example
title: "An approval leaves a receipt"
subjects:
  - UC-01m0f0wn89p42025mt5vg5012n
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
  - QA-01m0fp2hdkq55yrx9qr5t8pweh
  - BR-01m4at3x2fffqepx85tmvf3hxw
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/az-archive-nem-ir-vissza/conversation.md · J2"
    - ".kotta/changes/a-motor-maradek-igeretei/proposal.md · What changes"
  quote: null
  inferred: "The receipt now also records the fingerprint of each node the delta replaces (BR-01m4at3x2fffqepx85tmvf3hxw); the rest is the accepted text."
---

## Given

A change, "Add filtered export", whose planning report the operator has read, with no open decision and a model delta that validates.

## When

The calling-chat agent asks: "Land 'Add filtered export' - yes or no?", the operator answers yes, and the agent records it with `kotta approve` naming the operator.

## Then

The change carries `approval.yaml` naming who approved, when, and on what basis - the fingerprint of the delta that was put to the operator, and the fingerprint of every accepted node the delta replaces, as it stood at the yes - and `kotta archive` lands exactly that delta without asking again. Had the operator stayed silent, answered a different question, or said yes to something else earlier, there would be no receipt and the archive would refuse; had the delta changed after the yes, the archive would refuse it as no longer the one approved.
