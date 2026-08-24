---
id: EX-01m0f0wn8a9ymf0hhey9htdeh1
form: example
title: "The board refuses to write"
subjects:
  - BR-01m0f0wn89r5np2yce79y2pctq
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A running board serving a workspace.

## When

Any historical mutation endpoint is called.

## Then

The answer is 405 and canonical state is unchanged; actions and approvals remain in the calling chat, with the CLI as the recovery surface.
