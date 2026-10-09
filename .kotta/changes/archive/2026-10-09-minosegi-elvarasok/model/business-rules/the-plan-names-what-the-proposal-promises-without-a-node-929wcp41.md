---
id: BR-01m4gj0endmfx601pm929wcp41
form: business-rule
title: "The plan names what the proposal promises without a node"
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "chat · rp, 2026-10-09 14:4x: „a quality req-t pedig egy új change-be dobd be” — and, asked what the new change should hold: „hogy a kotta figyeljen rájuk és ha felmerül egy ilyen, jelezze ls vegye fel”"
  quote: "rp, 2026-10-09: „jelezze”"
  inferred: "The operator asked that Kotta flag a quality requirement when one comes up. A mechanical check — a list item of the proposal's What changes that names no node of the delta — is the agent's proposal for the flag; it cannot tell quality from other work, so it asks rather than decides."
---
# The plan names what the proposal promises without a node

## Rule

`kotta plan` SHALL list, as candidates awaiting judgement, every list item under the proposal's What changes that names no node of the delta and no accepted node by its title, and SHALL ask of each whether it is a promise — a quality attribute, a rule — that needs a node, or work that keeps no promise. It SHALL NOT block the gate on them.

## Rationale

The agent that left ten build notes in prose was the same agent that would have had to notice them; a second pair of eyes that is mechanical catches what judgement waved through. The check cannot know which prose is quality, so it only points and asks — the way conflict candidates do.

## Scope

`kotta plan`, on every change.
