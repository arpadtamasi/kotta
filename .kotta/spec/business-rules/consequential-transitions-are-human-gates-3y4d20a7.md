---
id: BR-01m0f0wn89zb3wfb3t3y4d20a7
form: business-rule
title: "Consequential transitions are human gates"
---

## Rule

Task close, cancel, and reopen, batch close, observation resolution, and decision creation take effect only on an explicit human yes, given in the conversation, for that exact transition. Anything less - silence, a yes to a different question, an earlier unrelated yes, an agent's judgement that the human would agree - is a no. Every approval is recorded on the entity it approved: who, when, and on what basis. Defining a covered task carries no gate of its own: the agreement was accepted when the spec the task executes landed on the base branch.

## Rationale

Human intent and acceptance are the explicit authority the whole model rests on. A gate must ask for real judgement and leave a durable receipt - approval without a record is ceremony, and a gate that re-asks what the accepted spec already answered trains the approval reflex the gates exist to prevent.

## Scope

Every approval-carrying mutation, on every surface - MCP elicitation and plain chat alike. Where no human is present, nothing is approved. The recorded receipt (approved_by, approved_at, approval_basis) is what makes a chat-relayed approval auditable.
