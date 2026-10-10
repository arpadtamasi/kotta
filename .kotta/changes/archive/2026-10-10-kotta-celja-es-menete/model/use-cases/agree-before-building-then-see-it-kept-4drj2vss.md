---
id: UC-01m4kbetjswsfc2vz74drj2vss
form: use-case
title: "Agree before building, then see it kept"
level: summary
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m4kbetcrer5bjb75djba5sct
includes:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
  - UC-01m0f0wn89ny7vx515ke3ksnra
  - UC-01m0f0wn89p42025mt5vg5012n
  - UC-01m4kbzh3rt3sjwmb49km5j1db
  - UC-01m0fpqfxjvet99wbz0v1ag64q
  - UC-01m4kbzhamtpt9gybc9kz6vbrx
accepted:
  - "structural: a journey is told by its steps; each step is kept by its own code, the summary itself by none"
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/kotta-celja-es-menete/conversation.md · K1"
    - "templates/AGENTS.md · Where a change lives"
    - ".kotta/changes/kotta-celja-es-menete/conversation.md · K2"
  quote: "chat  →  change (proposal + model delta)  →  technical model (Kotta forms)  →  code"
  inferred: "The steps and their order follow the rules file's own path from chat to code; naming them as one journey is the agent's; that building and archiving are steps of their own is the operator's answer (K2)."
---
# Agree before building, then see it kept

## Intent

The operator says what they want; an agent orients, shapes the change and brings it to the one gate; the operator says yes; the code is built naming the promises it keeps, and the operator sees what is kept and what is left.

## Preconditions

A repository with a Kotta workspace, a human operator and a coding agent in a calling chat.

## Main success scenario

1. The agent orients in the workspace.
2. The agent shapes the specification in a change, telling the product to a stranger first.
3. The operator approves the change at its gate, in the conversation.
4. The agent builds, citing each promise where the code keeps it.
5. The operator analyses the implementation gap: what is kept, what is left.
6. The agent archives the change, landing exactly what was approved.

## Alternatives

- 3a. The operator says no or asks for changes: the agent reshapes the change and asks again.
