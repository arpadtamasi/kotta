---
id: QA-01m4ghr8h4345h3tt86nb28eqx
form: quality-attribute
title: "The view holds still"
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
# The view holds still

## Source

A human moving between views and nodes while reviewing.

## Stimulus

Switching views, opening related nodes, expanding a tree.

## Environment

A desktop browser at 1312 × 735 CSS pixels, and a phone at 390 pixels wide, on a specification of a few hundred nodes.

## Artifact

The local board (`kotta ui`).

## Response

A view the reader switches to SHALL open at its top, and a view the reader returns to SHALL open where it was left. The tree SHALL offer to expand and collapse everything at once, and the filters SHALL be cleared with one action. Pointing at a related node SHALL show its title and first sentence without replacing the node that is open.

## Measure

Switching from the tree to a diagram and back restores the tree's scroll position within 10 pixels; a new view opens at 0. Expand-all and clear-filters are each one action. Checked by the board's browser suite.
