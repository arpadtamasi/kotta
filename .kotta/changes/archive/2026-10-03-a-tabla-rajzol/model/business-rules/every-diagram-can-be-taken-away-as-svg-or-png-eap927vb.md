---
id: BR-01m414skms7ph39bgaeap927vb
form: business-rule
title: Every diagram can be taken away as SVG or PNG
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ8"
  quote: "rp, 2026-10-03: „amúgy nagyon jó lenne, ha az ábrákat lehetne copyzni svg-ként vagy png-ként / a ui-ról”"
  inferred: "Saving as a file beside copying, the SVG being the drawing itself rather than a screenshot, and the PNG embedding the board's font are the agent's; the operator asked for copying as SVG or PNG from the board."
---
# Every diagram can be taken away as SVG or PNG

## Rule

The board SHALL offer, under every diagram it draws, to copy it to the clipboard and to save it as a
file, each as SVG and as PNG. The SVG SHALL be the drawing itself — shapes, paths and text in the
current theme — not a picture of the page; the PNG SHALL look as the diagram does on the page. Taking
a diagram away SHALL write nothing to the workspace.

## Rationale

A diagram is worth most where the specification is discussed — a slide, a document, a drawing tool —
and redrawing it there by hand loses what the board read from the model.

## Scope

Every diagram the board draws, with either renderer, in the accepted view and in an opened change.
