---
id: UC-01m0f0wn89p42025mt5vg5012n
form: use-case
title: "Approve a gate in conversation"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
interfaces:
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Keep every consequential lifecycle transition a human decision, made in the conversation, with a durable receipt.

## Preconditions

One exact, entity-scoped transition is prepared: task close, cancel, or reopen; batch close; observation resolve; or decision create.

## Main success scenario

The agent puts the decision to the operator in their language: what will happen, named by title, one line, then a plain yes or no - never an id, never a command to run. On an explicit yes in this conversation for this exact decision, the agent applies the validated mutation once; the record carries who approved, when, and on what basis, linking the visible human response.

## Alternatives

Silence, a yes to a different question, an earlier unrelated yes, or the agent's own judgement: all are a no. The host refuses the approval form: the agent asks in plain chat instead of falling back to the terminal. The application fails: the failure is durable and never masquerades as a successful transition. No human present: no approval.
