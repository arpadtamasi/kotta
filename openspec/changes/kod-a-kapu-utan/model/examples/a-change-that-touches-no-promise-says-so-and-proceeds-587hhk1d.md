---
id: EX-01m3kdq91dfgf22v9s587hhk1d
form: example
title: A change that touches no promise says so and proceeds
capability: planning-phase
subjects:
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md · Scenario: Ígéretet nem érintő change"
  quote: "az ügynök egy sorban kimondja, hogy a change nem érint ígéretet, és implementál"
---
# A change that touches no promise says so and proceeds

## Given

A change that only rewrites documentation, or refactors code without adding, changing or removing any accepted promise.

## When

The human asks the agent to apply it.

## Then

The agent says, in one line, that the change touches no promise and needs no model delta, and then implements it without a gate.
