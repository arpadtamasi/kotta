---
id: QA-01m4ghr864w6xe125fkvrdptmh
form: quality-attribute
title: "Anything on the board can be found and linked"
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
# Anything on the board can be found and linked

## Source

A human who remembers a phrase but not a title, or who wants to show someone what they see.

## Stimulus

Searching for a phrase, or copying the page's address, or working from the keyboard.

## Environment

A desktop browser at 1312 × 735 CSS pixels, and a phone at 390 pixels wide, on a specification of a few hundred nodes.

## Artifact

The local board (`kotta ui`).

## Response

The board's search SHALL match a node's title and the text of its sections. The view, its filters, the search and the opened node SHALL be held in the page's address, so a copied address opens the same screen. The keyboard SHALL reach search with `/`, close the open node with Escape, and walk the tree with the arrow keys. Scrolling over a diagram SHALL scroll the page; the diagram SHALL pan only while it has the focus or a modifier key is held.

## Measure

Every phrase of a node's body finds that node. A copied address restores the same view, filters, search and node in 100% of the suite's cases. The three keys work on every view. Checked by the board's browser suite.
