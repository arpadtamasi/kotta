---
id: EX-01m4gg8xtv2dgnnazgrfag2j59
form: example
title: "An empty specification opens on its one change"
subjects:
  - BR-01m40e522gtq49knhy51hr9e3d
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
# An empty specification opens on its one change

## Given

The intimity workspace as it was on 2026-10-09 before its baseline was archived: no accepted node on the base branch and one open change, *baseline*, with 226 nodes.

## When

The human runs `kotta ui`.

## Then

The board opens on the change *baseline*, its model and proposal shown; the accepted view is one click away and still says it holds nothing.
