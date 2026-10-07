---
id: EX-01m4at3x8bvsh0cfn5z5wvp380
form: example
title: A node changed after the approval stops the archive
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

# A node changed after the approval stops the archive

## Given

Change A replaces the rule *Building an approved change needs no signal* to add one subject, and is approved. Then change B rewrites the same rule's text, is approved and archived.

## When

`kotta archive` runs on change A.

## Then

It refuses, names *Building an approved change needs no signal*, and says it changed after A was approved; nothing is written. B's text stays accepted. Once A's copy is taken again with B's text and A's subject added, planned and approved, the archive lands it.
