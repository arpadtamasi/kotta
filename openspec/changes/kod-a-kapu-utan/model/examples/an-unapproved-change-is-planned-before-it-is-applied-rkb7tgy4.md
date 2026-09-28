---
id: EX-01m3kdq8kg96c3151xrkb7tgy4
form: example
title: An unapproved change is planned before it is applied
capability: planning-phase
subjects:
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md · Scenario: Jóvá nem hagyott change alkalmazása"
  quote: "nem ír kódot a feladataihoz, hanem megmondja, hogy előbb a tervezési fázis jön"
---
# An unapproved change is planned before it is applied

## Given

An OpenSpec change with a proposal and a `tasks.md`, and no approved and archived model delta, in a repository whose agent has both the Kotta and the OpenSpec skills.

## When

The human asks the agent to apply the change (`opsx:apply`, or "implement this").

## Then

The agent writes no code for the change's tasks. It says that the planning phase comes first, drafts the model delta, runs `kotta plan` and puts the delta to the human at the one gate; it implements only after the delta was approved and archived.
