---
id: BR-01m4ggqbpgfp2w72q9p9yt2era
form: business-rule
title: "The import asks what its goals serve"
capability: technical-model
provenance:
  level: inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ2"
  quote: "rp, 2026-10-09: „inkább az az érdekes, hogy az elmondásod jó volt, a hierarchia meg ezek szerint más”"
  inferred: "Raised by the specification critic. Asking rather than drafting a purpose follows *Agents never invent intent*; the wording is the agent's."
---
# The import asks what its goals serve

## Rule

When `kotta import openspec` drafts more than one goal, it SHALL write into the change's proposal, under Open decisions, the question which purpose those goals serve and which journey the product's use cases form, and SHALL NOT draft a purpose goal or a summary use case itself.

## Rationale

One goal per capability is all a narrative states, so the import is where a model becomes flat. The purpose and the journey are product intent: the import may not invent them, but it can make sure nobody plans the change without being asked.

## Scope

`kotta import openspec`.
