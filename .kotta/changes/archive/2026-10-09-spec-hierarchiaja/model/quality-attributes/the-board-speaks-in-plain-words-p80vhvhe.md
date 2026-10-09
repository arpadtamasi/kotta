---
id: QA-01m4ghr8bn64wazxnap80vhvhe
form: quality-attribute
title: "The board speaks in plain words"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P2"
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P5"
  quote: "rp, 2026-10-09: „igen ez jó minőségi req-k eddig nem voltak talán”"
  inferred: "The operator agreed that the build notes become quality requirements (conversation P5, left unpaired by the distiller, so not cited as an approval). Their grouping, the responses and every threshold are the agent's, drawn from the 2026-10-09 design critique of the board on the intimity specification."
---
# The board speaks in plain words

## Source

A human who knows the product, not Kotta's file format.

## Stimulus

Reading labels, counts and simulations on any view.

## Environment

A desktop browser at 1312 × 735 CSS pixels, and a phone at 390 pixels wide, on a specification of a few hundred nodes.

## Artifact

The local board (`kotta ui`).

## Response

The board SHALL label provenance, status and level in plain words, never with a field's raw name or value. The browser tab SHALL name Kotta and the project. A count beside a view SHALL count what that view lists. The same kind of node SHALL be named with the same word in the tree, the diagrams and the drawer. A simulation — marking a use case as dropped — SHALL say on screen that it is a simulation and that nothing is changed.

## Measure

On each view of the intimity fixture, no label shows a raw field name or an upper-case enumeration value; every count equals the number of items its view lists. Checked by the board's browser suite.
