---
id: EX-01m414smebtmh18j4jxxsbabhh
form: example
title: The batch lifecycle is drawn from its one paragraph
subjects: [BR-01m414skt0pcqb668azj7czkeq]
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ5"
  quote: "rp, 2026-10-03: „a state machine nem jó”"
  inferred: "The case is the operator's own batch lifecycle, shortened by the agent."
---
# The batch lifecycle is drawn from its one paragraph

## Given

A state machine whose States section reads "backlog - defined - active - done." and whose Transitions
section is one paragraph: "backlog -> defined: validate - the batch becomes defined. Validation
refuses otherwise. defined -> active: start creates the branch. last member terminal -> done:
automatic, whether or not it was started."

## When

The board draws the state machine.

## Then

It draws three transitions — backlog to defined, defined to active, and "when last member terminal"
to done — with "when last member terminal" drawn as a condition, not a state; the reason of the first
keeps both of its sentences, and no line is left over as prose.
