---
id: BR-01m4gj0efhjmpmdw58am4f0c46
form: business-rule
title: "A quality requirement is recorded where it is said"
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - "chat · rp, 2026-10-09 14:4x: „a quality req-t pedig egy új change-be dobd be” — and, asked what the new change should hold: „hogy a kotta figyeljen rájuk és ha felmerül egy ilyen, jelezze ls vegye fel”"
    - ".kotta/changes/minosegi-elvarasok/conversation.md · P2"
  quote: "rp, 2026-10-09: „hogy a kotta figyeljen rájuk és ha felmerül egy ilyen, jelezze és vegye fel”"
  inferred: "The operator stated the intent: Kotta watches for quality requirements, flags one when it comes up and records it. Where the watching happens (the agent while planning, the plan report) and the wording are the agent's."
---
# A quality requirement is recorded where it is said

## Rule

When the conversation or a proposal says how well the product must do something — how readable, findable, fast, stable, accessible or calm it must be — the agent SHALL say in the conversation that it is a quality requirement and SHALL draft it into the change as a quality attribute with a response and a measure; where nobody has said the measure, the agent SHALL ask for it under Open decisions rather than choose one silently. The agent SHALL NOT leave such a requirement as a build note in the proposal's prose.

## Rationale

A build note in prose protects nothing: the proposal is history once the change is archived, nothing can cite a note, and `kotta gap` cannot count it, so the first regression goes unnoticed. On 2026-10-09 the agent planning the board's hierarchy left ten such notes — no 9px labels, a low sticky header, search over body text — judging them "only presentation"; the operator asked why nothing protected them, and they became four quality attributes. Kotta's own specification had held only four quality attributes, none about reading the board: quality is said often and recorded rarely.

## Scope

Every change an agent plans under the rules Kotta ships (the rules file and the `plan-change` and `quality-scenarios` skills).
