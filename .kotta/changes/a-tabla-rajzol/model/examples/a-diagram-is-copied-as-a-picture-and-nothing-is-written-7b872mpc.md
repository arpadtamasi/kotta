---
id: EX-01m414sm6ttpg2fmsn7b872mpc
form: example
title: A diagram is copied as a picture and nothing is written
subjects: [BR-01m414skms7ph39bgaeap927vb]
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ8"
  quote: "rp, 2026-10-03: „copyzni svg-ként vagy png-ként / a ui-ról”"
  inferred: "The concrete case is the agent's."
---
# A diagram is copied as a picture and nothing is written

## Given

The board open on the use case diagram of a workspace whose working tree is clean.

## When

The reader presses "Copy SVG", then "Save PNG".

## Then

The clipboard holds the diagram as SVG text that begins with `<svg`, a PNG file named after the
diagram (`use-case-diagram.png`) is saved by the browser, the board says each worked, and the
workspace's working tree is still clean.
