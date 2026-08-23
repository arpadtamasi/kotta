---
id: EX-01m0f0wn8a9ymf0hhey9htdeh1
form: example
title: "The board refuses to write"
subjects:
  - BR-01m0f0wn89r5np2yce79y2pctq
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A running board serving a workspace.

## When

Any historical mutation endpoint is called.

## Then

The answer is 405 and canonical state is unchanged; actions and approvals remain in the calling chat, with the CLI as the recovery surface.
