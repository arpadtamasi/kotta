---
id: QA-01m4ghr80v0r92aw1d9rq9zt6f
form: quality-attribute
title: "The board reads calmly"
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
# The board reads calmly

## Source

A human reviewing a specification or an open change on the board.

## Stimulus

Reading a long list of nodes, or a change with its proposal and provenance.

## Environment

A desktop browser at 1312 × 735 CSS pixels, and a phone at 390 pixels wide, on a specification of a few hundred nodes.

## Artifact

The local board (`kotta ui`).

## Response

The board SHALL show a mark that every row of a list carries once, in the list's head, and not on the rows. The part of the page that stays in place while the reader scrolls SHALL stay small, and SHALL NOT grow when the proposal or the provenance of a change is opened: these SHALL open in the page's flow, the provenance summary closed until asked for.

## Measure

At 1312 × 735, with the proposal closed and with it open, the fixed part of the page is at most 120 pixels high. On every list view, no mark that all of its rows share appears on a row. Checked by the board's browser suite on a fixture of at least 200 nodes.
