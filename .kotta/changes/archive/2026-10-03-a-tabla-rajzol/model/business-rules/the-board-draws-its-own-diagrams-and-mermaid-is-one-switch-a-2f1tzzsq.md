---
id: BR-01m414skfbftb3zv6z2f1tzzsq
form: business-rule
title: 'The board draws its own diagrams, and Mermaid is one switch away'
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ3"
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ7"
    - ".kotta/changes/a-tabla-rajzol/conversation.md · J1"
  quote: "rp, 2026-10-03: „a dagre szar / a másik kettő jó / be tudod tenni mindbe?” … „akarom figyelni, melyik mikor hogy működik”"
  inferred: "That the board's own renderer is the default and Mermaid the alternative, and that the choice is kept in the address, are the agent's; the operator chose the two renderers and asked to keep watching both."
---
# The board draws its own diagrams, and Mermaid is one switch away

## Rule

The board SHALL draw the use case diagram, the entity map and every state machine with its own
renderer by default: laid out by ELK, each node drawn in the board's own markup with its provenance
frame, opening the node on a click and lighting its connections on hover. A switch beside every
diagram SHALL redraw the same reading with Mermaid, also laid out by ELK, with its source one click
away; the choice SHALL be kept in the page address, so two tabs can show the two side by side. The
board SHALL NOT offer the dagre layout.

## Rationale

The dagre layout crossed its edges everywhere and Mermaid's nodes could only be themed, not drawn;
the operator judged dagre unusable and both ELK renderers good, and wants to keep comparing them on
real projects before settling on one.

## Scope

The board's three graph views: use cases, entities, state machines. The story map is not a graph and
stays a grid of cards.
