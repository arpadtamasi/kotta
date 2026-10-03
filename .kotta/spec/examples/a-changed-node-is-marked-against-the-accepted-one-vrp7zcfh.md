---
id: EX-01m40e52dx6qscs9cevrp7zcfh
form: example
title: A changed node is marked against the accepted one
capability: planning-phase
subjects:
  - BR-01m40e522gtq49knhy51hr9e3d
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-mutatja-a-valtozast/conversation.md · SZ1"
  quote: "rp, 2026-10-02: „change-et nem mutat a ui, pedig...”"
  inferred: "The case is the agent's illustration of the rule it proposes."
---

# A changed node is marked against the accepted one

## Given

An accepted rule *Quitting asks for confirmation*, and an open change whose model carries the same rule with a new text and removes the example that proved the old one.

## When

The human opens the change on the board.

## Then

The rule is shown with its new text, marked changed, and the old text is available beside it; the example is shown marked removed; every other accepted node is shown unmarked.
