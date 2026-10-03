---
id: EX-01m40e5289ztd19t2he1g3vw2b
form: example
title: An uncommitted change appears on the board
capability: planning-phase
subjects:
  - BR-01m40e522gtq49knhy51hr9e3d
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-mutatja-a-valtozast/conversation.md · SZ1"
  quote: "rp, 2026-10-02: „change-et nem mutat a ui, pedig...”"
  inferred: "The case is the agent's illustration of the rule it proposes."
---

# An uncommitted change appears on the board

## Given

A workspace with no accepted node and an open change `elso-szelet` whose model holds a goal, a use case and three rules, none of it committed.

## When

The human runs `kotta ui` and opens the change.

## Then

The board lists `elso-szelet` as an open change; opened, it shows the five nodes as added, the proposal's text and its open decisions, and says the change is neither planned nor approved.
