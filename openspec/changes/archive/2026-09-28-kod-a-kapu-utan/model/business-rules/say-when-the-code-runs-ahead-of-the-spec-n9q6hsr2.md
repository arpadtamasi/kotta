---
id: BR-01m3kdq88m3bgye3xnn9q6hsr2
form: business-rule
title: Say when the code runs ahead of the spec
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - "chat with the operator, 2026-09-28"
    - "openspec/changes/kod-a-kapu-utan/proposal.md · Why"
  quote: "rp, 2026-09-28, chat: „igen, de ne legyen erőszakos — csak jelezze, ha elúszik a spec”"
  inferred: "The operator set the rule's force (a signal, never a stop) and its trigger (the spec drifting). The wording — one line, naming the promise, offering the planning phase, silence when no promise is touched — is the agent's."
---
# Say when the code runs ahead of the spec

## Rule

An agent MAY implement a change — through the OpenSpec `opsx:apply` skill or by hand — whether or not its model delta has been through the gate. When the code it writes keeps, changes or drops a promise the accepted model does not state, the agent SHALL say so to the human in one line, naming the promise in plain words, and SHALL offer the planning phase (`plan-change`) to bring the model up to the code. It SHALL NOT stop, refuse or delay the work for this. When the work touches no promise — documentation, a pure refactor — it says nothing about the spec.

## Rationale

The operator's concern was that an agent working from an OpenSpec change leaves Kotta aside and the technical model silently falls behind the code. The operator also said the rule must not be forceful. A one-line signal at the moment of drift keeps the human informed and the choice theirs: plan now, or later, or not at all. A prohibition would turn Kotta into a process engine again, which 1.0 removed on purpose.

## Scope

Every agent working in a Kotta repository, on any host, on any change. The signal is the agent's, carried by the shipped rules file; the CLI does not see code being written and enforces nothing. `kotta gap` remains the after-the-fact measure of the same drift.
