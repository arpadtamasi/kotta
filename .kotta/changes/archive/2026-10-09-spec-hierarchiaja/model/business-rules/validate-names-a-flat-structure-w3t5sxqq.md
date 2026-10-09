---
id: BR-01m4ggqbgh250jcn09w3t5sxqq
form: business-rule
title: "Validate names a flat structure"
capability: technical-model
provenance:
  level: inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ2"
  quote: "rp, 2026-10-09: „inkább az az érdekes, hogy az elmondásod jó volt, a hierarchia meg ezek szerint más”"
  inferred: "Raised by the specification critic: agents read the CLI, not the board, and the import is what produced the flat goals. The warnings and their wording are the agent's."
---
# Validate names a flat structure

## Rule

`kotta validate` SHALL warn, never fail, when several goals serve no other goal, when an actor has more than one `user-goal` use case and no summary use case includes any of them, and when a `user-goal` use case is off every journey while its goal is served by a journey step — a use case with no `level` counting as `user-goal`; each warning SHALL name the nodes and the question that would close it.

## Rationale

Agents orient by the CLI, not by the board. If only the board names a flat structure, the agent that drafts the next change never learns that the model has no purpose and no journey, and keeps adding siblings.

## Scope

`kotta validate`, on the accepted specification and on every open change.
