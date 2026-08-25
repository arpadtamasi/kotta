---
id: BR-01m0vqr9k6r571egp3z8qwnpkj
form: business-rule
title: "An approval carries only the payload its action needs"
---

## Rule

Each approval action declares the exact payload fields it accepts, and a proposal carrying anything else is refused before the human is asked. Retiring a task takes its resolution, its reason, and the task or decision that superseded it - nothing more, and the superseding reference is required whenever the resolution claims something took the work's place. Dispositioning an observation takes its disposition, and the amended specification nodes only when the disposition is the one that amends the specification. Every other gated action takes no payload at all.

## Rationale

The payload is what the human is shown and what the mutation is applied from, so an unconstrained payload is an unconstrained decision: a field nobody named could change what the yes means between the question and the effect. Refusing before the elicitation also keeps a malformed request from spending the human's attention.

## Scope

Every approval proposal, on every surface. The rule constrains the shape of the request, not the judgement: a well-formed payload is still only a question until a human answers it.
