---
id: EX-01m4ggqd7z6b055594jy17zjzw
form: example
title: "The intimity import asks what its goals serve"
subjects:
  - BR-01m4ggqbpgfp2w72q9p9yt2era
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ3"
    - "chat · rp, 2026-10-09 14:2x, answers to structured questions after the critics: „Összefoglaló eset” (a summary-level use case that includes the steps carries the journey, no follows edge), „Igen, a célból induljon” (the tree starts from the goal; the actor arrangement one switch away), „Egy change marad”"
  quote: "rp, 2026-10-09: „kb úgy is, hogy a fenti leírást le tudják-e követni rajta, és ha igen, miért nem”"
  inferred: "The case is the intimity specification as reviewed on 2026-10-09 (archived as 2026-10-09-baseline). The purpose goal *Find an evening both welcome* and the summary *Spend an evening together* are hypothetical, the agent's illustration — intimity's own purpose and journey are decided in intimity, in a change of its own. The wording of what Kotta shows is the agent's."
---
# The intimity import asks what its goals serve

## Given

The intimity OpenSpec narrative, with eight capabilities each stating a Purpose.

## When

`kotta import openspec` runs.

## Then

It drafts eight goals, no purpose goal and no summary use case, and the change's proposal lists under Open decisions which purpose the eight goals serve and which journey the use cases form.
