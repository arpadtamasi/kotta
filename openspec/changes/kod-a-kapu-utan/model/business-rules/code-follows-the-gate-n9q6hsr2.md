---
id: BR-01m3kdq88m3bgye3xnn9q6hsr2
form: business-rule
title: Code follows the gate
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/kod-a-kapu-utan/proposal.md · Why"
    - "openspec/changes/kod-a-kapu-utan/proposal.md · What Changes"
    - "openspec/changes/kod-a-kapu-utan/design.md · 2. „Jóváhagyva és archiválva\""
  quote: "rp, 2026-09-28, chat: „az agents/claude md-be beírjuk, hogy használni kell a kottát? különben elhagyja\""
  inferred: "The operator asked whether the instruction files should say Kotta must be used; the rule's wording — approved and archived before any task is implemented, the planning phase run first and said aloud, the one-line exception for a change that touches no promise — was supplied by the agent."
---
# Code follows the gate

## Rule

An agent SHALL NOT implement a change's tasks — through the OpenSpec `opsx:apply` skill or by hand — before the change's model delta has been approved by the human and archived. An agent asked to apply a change whose delta is not yet approved and archived SHALL first run the planning phase (`plan-change`), put the delta to the human at the one gate, and say that this is what it is doing. A change that adds, changes and removes no accepted promise — documentation, a pure refactor — MAY proceed without a delta; the agent SHALL say so in one line before it does.

## Rationale

The rules file described the flow from narrative to model delta to the one gate, but no rule forbade skipping it, and an agent that has the OpenSpec skills applies a change straight from its `tasks.md`. Code written before the gate keeps promises nobody accepted, and the gate then only approves what already exists. Requiring the archive as well means the accepted model already says what the code will keep when the code is written, so `kotta gap` reports missing evidence rather than an unaccepted promise.

## Scope

Every agent working in a Kotta repository, on any host, and every change under `openspec/changes/`. The planning phase itself — drafting the narrative and the delta, running `kotta plan` — is not implementation and needs no gate. Not a change that touches no promise, which proceeds on its one line. The rule is carried by the shipped rules file; the CLI does not see code being written and does not enforce it.
