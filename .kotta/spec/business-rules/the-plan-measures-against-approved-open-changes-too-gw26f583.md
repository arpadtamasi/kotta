---
id: BR-01m4kazy06s3yg2d2pgw26f583
form: business-rule
title: "The plan measures against approved open changes too"
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/tervezes-mindent-lat/conversation.md · SZ2"
  quote: "rp, 2026-10-10: „kezeld a hiákat”"
  inferred: "The gaps were the agent's list after the 2026-10-09 work — the plan missed a clash with an approved open change, the distillate missed the human's answers, the plan reported archived citations as unresolved; the operator asked that they be handled. The remedies are the agent's."
---
# The plan measures against approved open changes too

## Rule

`kotta plan` SHALL look for conflict candidates against the accepted model with every other open change that holds an approval to its current delta laid over it, and SHALL name the changes it laid over.

## Rationale

Between approval and archive an approved delta is the agreement for the nodes it touches. On 2026-10-09 a change made stepping back in the drawer open a node at its top; *The view holds still*, approved in another change still open, said the opposite. The plan measured only the accepted model and saw nothing; a critic found it by hand.

## Scope

`kotta plan`, on every change.

