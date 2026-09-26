---
id: BR-01m0f0wn89zb3wfb3t3y4d20a7
form: business-rule
title: "Consequential transitions are human gates"
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "CHANGELOG.md · 1.0.0-alpha.1 · Added · The planning phase and the one human gate"
    - "templates/AGENTS.md · Rules for agents · 4"
  quote: "There is one such gate per change, at the end of planning, and none after it."
  inferred: "The accepted rule named the 0.x gates (task close, cancel and reopen, batch close, observation resolution, decision creation), which the release removed; the agent restated the same rule for the one gate that remains, keeping its standard of a yes and its receipt."
---

## Rule

A change to the accepted specification SHALL take effect only on an explicit human yes, given in the conversation, for that exact change: the one gate at the end of its planning. Anything less - silence, a yes to a different question, an earlier unrelated yes, an agent's judgement that the human would agree - is a no. The yes MUST be recorded beside the change it approved: who gave it, when, and on what basis, the basis being the fingerprint of exactly the model delta that was put to the human. Landing the change asks nothing again, and lands nothing the receipt does not cover: a change with no receipt, or whose delta no longer matches it, is refused.

## Rationale

Human intent and acceptance are the explicit authority the whole model rests on. A gate must ask for real judgement and leave a durable receipt - approval without a record is ceremony, and a gate that re-asks what was already decided trains the approval reflex the gate exists to prevent. Binding the receipt to the delta is what stops a yes given to one delta from landing another.

## Scope

Every change that lands in the accepted specification, on every surface - the calling chat and the terminal alike. Where no human is present, nothing is approved. Not the shaping of a draft, which needs no gate until it is put forward to land. The recorded receipt (approved_by, approved_at, approval_basis) is what makes a chat-relayed approval auditable; it records the claimed approver and does not authenticate who typed the command.
