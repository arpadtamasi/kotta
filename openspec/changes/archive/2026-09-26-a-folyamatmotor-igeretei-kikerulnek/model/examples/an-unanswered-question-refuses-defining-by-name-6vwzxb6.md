---
id: EX-01m0z873t1cmhybhakq6vwzxb6
form: example
title: "An unanswered question refuses the approval by name"
subjects:
  - BR-01m0z873stwx7szg5896gwsbry
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "CHANGELOG.md · 1.0.0-alpha.1 · Added · The planning phase and the one human gate"
  quote: "It refuses without a planning report, with a report older than the model it describes, with an open question, or with a delta that does not validate."
  inferred: "The accepted example refused defining a task, a command the release removed; the agent restated it for the gate that now reads the enumeration, keeping the three questions and which of them is named."
---

## Given

A change whose model delta holds a rule with three questions under Open decisions, the first of them naming the decision that settled it.

## When

The agent records the human's approval of the change.

## Then

The approval is refused naming the second and the third question by their position and their text, and no receipt is written; the first is not named, because a question naming a decision is answered. The planning report lists the same two as open.
