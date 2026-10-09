---
id: BR-01m4gh4rxe5navrnzfz0t5a2jf
form: business-rule
title: "The board says what the human decided"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P2"
  quote: "rp, 2026-10-09: „igen, fontos, nekem is hiányzott”"
  inferred: "The operator answered „igen, fontos, nekem is hiányzott” to the agent's list of what keeps the board from 40/40 (conversation P2, which the distiller left unpaired, so it is not cited as an approval). That the answer is the approval receipt plus the list the human was shown at the gate, and the wording, are the agent's."
---
# The board says what the human decided

## Rule

Where the board shows an approved change, or an accepted node that landed through one, it SHALL say what that approval covers: who said yes and when, that the yes covers the whole delta as planned, and, as the nodes' provenance records it, how many of its nodes the human decided, how many the human approved on the agent's proposal, and how many the agent decided alone; and it SHALL let the reader open the list of what the agent decided alone exactly as the planning report put it to the human at the gate. An accepted node SHALL name the change that landed it, who approved that change and when, and its own provenance mark. A node the agent decided alone SHALL be marked as decided by the agent and approved with the delta, never as reviewed by the human one by one. A change not yet approved SHALL say that nobody has said yes to it.

## Rationale

In intimity the board showed "approved" beside "the agent decided 223": the reader could not tell whether a human had looked at 223 nodes, at three, or at none. The gate is one yes to a delta, given after the planning report listed what the agent decided alone; the board has to say exactly that, no more and no less, or the approval reads as a review that did not happen.

## Scope

`kotta ui`: for an open change on its banner and on each node it shows, and for every accepted node, read from the receipt of the change that landed it.
