---
id: EX-01m4at3xera2pxgcey1tvxmz88
form: example
title: A node unchanged since the approval lands as before
capability: planning-phase
subjects:
  - BR-01m4at3x2fffqepx85tmvf3hxw
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/az-archive-nem-ir-vissza/conversation.md · J1"
    - ".kotta/changes/az-archive-nem-ir-vissza/conversation.md · J2"
    - "https://github.com/arpadtamasi/kotta/issues/61"
  quote: "rp, 2026-10-06/07: „igen” (to: the archive should stop instead of reverting) — „igen és neki is állhatsz”"
  inferred: "The case is the agent's illustration, from the a-motor-maradek-igeretei archive of 2026-10-06."
---

# A node unchanged since the approval lands as before

## Given

An approved change that replaces three accepted nodes, none of which any other change touched since the approval.

## When

`kotta archive` runs on it.

## Then

The three nodes are replaced with the change's copies, as before; no question is asked again.
