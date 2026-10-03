---
id: EX-01m3kdq8kg96c3151xrkb7tgy4
form: example
title: Code ahead of the model is named in one line
capability: planning-phase
subjects:
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - "chat with the operator, 2026-09-28"
  quote: "rp, 2026-09-28, chat: „igen, de ne legyen erőszakos — csak jelezze, ha elúszik a spec”"
  inferred: "The upload-limit instance is the agent's illustration."
---
# Code ahead of the model is named in one line

## Given

A change whose model delta has not been through the gate, adding a behaviour no accepted node states — say, an upload limit the model does not mention.

## When

The human asks the agent to implement it.

## Then

The agent implements the change. In one line it says that the code now keeps a promise the model does not state, names it in plain words, and offers to run the planning phase. It does not stop or wait for an answer.
