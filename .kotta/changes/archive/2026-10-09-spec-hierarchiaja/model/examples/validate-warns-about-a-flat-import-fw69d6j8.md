---
id: EX-01m4ggqd1y597jjpamfw69d6j8
form: example
title: "Validate warns about a flat import"
subjects:
  - BR-01m4ggqbgh250jcn09w3t5sxqq
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
# Validate warns about a flat import

## Given

The intimity specification as imported on 2026-10-09.

## When

`kotta validate` runs.

## Then

It passes, with two warnings: eight goals serve no other goal, naming them and asking which purpose they serve; the Player has nine use cases and no summary use case, asking which journey they form.
