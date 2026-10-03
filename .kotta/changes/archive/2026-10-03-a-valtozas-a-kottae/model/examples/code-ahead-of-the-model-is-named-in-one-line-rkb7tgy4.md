---
id: EX-01m3kdq8kg96c3151xrkb7tgy4
form: example
title: A promise the model does not state opens a change first
capability: planning-phase
subjects:
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P7"
    - "chat with the operator, 2026-09-28"
  quote: "rp, 2026-09-28, chat: „igen, de ne legyen erőszakos — csak jelezze, ha elúszik a spec”"
  inferred: "The upload-limit instance is the agent's illustration."
---
# A promise the model does not state opens a change first

## Given

A change whose model delta has not been through the gate, adding a behaviour no accepted node states — say, an upload limit the model does not mention.

## When

The human asks the agent to implement it.

## Then

The agent does not write the code. In one line it says that the work adds a promise the model does not state — an upload limit — and opens a change for it; the code is written after the human approves that change.
