---
id: EX-01m4gg8wkj7dzaje345c4ska46
form: example
title: "Intimity's goals serve one purpose"
subjects:
  - BR-01m4gg8vnq75d4rkw1e0x1b734
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
# Intimity's goals serve one purpose

## Given

The intimity specification with eight goals, none naming another, and a new goal *Find an evening both welcome, without one-sided vulnerability*.

## When

Each of the eight goals names the new goal under `serves`, and `kotta validate` runs; then *Find an evening both welcome* is made to serve *Each partner can answer honestly, in private*.

## Then

The first run validates; the second is refused, naming the cycle between the two goals.
