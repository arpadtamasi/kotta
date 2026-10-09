---
id: BR-01m4ggqbayfx5szaspsvpc7apt
form: business-rule
title: "A summary use case tells a journey"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ3"
    - "chat · rp, 2026-10-09 14:2x, answers to structured questions after the critics: „Összefoglaló eset” (a summary-level use case that includes the steps carries the journey, no follows edge), „Igen, a célból induljon” (the tree starts from the goal; the actor arrangement one switch away), „Egy change marad”"
  quote: "rp, 2026-10-09: „kb úgy is, hogy a fenti leírást le tudják-e követni rajta, és ha igen, miért nem”"
  inferred: "The operator chose that a summary-level use case including the steps carries the journey, with no new edge. That the order of its includes is the step order, and what counts as on and off a journey, are the agent's."
---
# A summary use case tells a journey

## Rule

A use case at the `summary` level SHALL be read as a journey: the use cases it includes are its steps, in the order its `includes` list names them. A step MAY serve a different goal than the summary and than the other steps. A use case that extends a step SHALL be read as on that journey, as a variant of the step. A use case with no `level` SHALL be counted as `user-goal`; one that no summary includes, directly or through another step, and that extends no step, SHALL be read as off every journey. No Kotta command SHALL reorder a use case's `includes` list.

## Rationale

A product is told as a journey — in intimity: pair, deal, answer in private, see the result — and the four steps serve four different goals, so no order inside one goal can carry it. Cockburn's summary level and UML's include already say "this goal is reached through these steps"; what was missing is only that the order of the steps is meant. A separate order edge between use cases was considered and turned down: "deal comes after pair" is mostly "pairing makes dealing possible", a precondition rather than a sequence, and UML leaves such an edge out for that reason. Whatever no journey includes — discreet use, installing, signing in — is then visibly support, not part of the story.

## Scope

The use-case form Kotta ships (its `level` and `includes` exist since *A use case can be decomposed*), `kotta validate`, and the board.
