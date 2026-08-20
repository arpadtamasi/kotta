---
id: EX-01m0f0wn8a9ymf0hhey9htdeh1
form: example
title: "The board refuses to write"
subjects:
  - BR-01m0f0wn89r5np2yce79y2pctq
---

## Given

A running board serving a workspace.

## When

Any historical mutation endpoint is called.

## Then

The answer is 405 and canonical state is unchanged; actions and approvals remain in the calling chat, with the CLI as the recovery surface.
