---
id: EX-01m414skz957zjghee0wqjx5m6
form: example
title: The renderer switch redraws the same diagram
subjects: [BR-01m414skfbftb3zv6z2f1tzzsq]
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ7"
  quote: "rp, 2026-10-03: „akarom figyelni, melyik mikor hogy működik”"
  inferred: "The concrete case is the agent's."
---
# The renderer switch redraws the same diagram

## Given

A workspace with entities, and the board open on the entity map with no renderer in the address.

## When

The reader chooses "Mermaid · ELK" on the switch above the diagram.

## Then

The board's own drawing is replaced by Mermaid's drawing of the same entities and the same arrows,
with its source under it; the address now carries `renderer=elk`, and reopening that address draws
with Mermaid again. "React Flow · ELK" brings the board's own drawing back; no dagre option is offered.
