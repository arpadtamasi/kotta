---
id: BR-01m4kazyfbvyapfr0h6dcx1n3y
form: business-rule
title: "A citation of an archived conversation resolves in the plan"
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/tervezes-mindent-lat/conversation.md · SZ2"
  quote: "rp, 2026-10-10: „kezeld a hiákat”"
  inferred: "The gaps were the agent's list after the 2026-10-09 work — the plan missed a clash with an approved open change, the distillate missed the human's answers, the plan reported archived citations as unresolved; the operator asked that they be handled. The remedies are the agent's."
---
# A citation of an archived conversation resolves in the plan

## Rule

`kotta plan` SHALL resolve a citation of another change's conversation — open, or archived since — the way the board opens it, and SHALL list it as unresolved only when no such conversation exists or no heading in it names the cited part.

## Rationale

A node a change carries over from the accepted model keeps citing the conversation of the change that wrote it. Once that change is archived the citation is still good — *A citation of an archived change still opens* — yet the plan listed it as unresolved, and asked for it to be renamed to the new change's conversation, which says nothing about it.

## Scope

`kotta plan`, the provenance citations of a change's nodes.

