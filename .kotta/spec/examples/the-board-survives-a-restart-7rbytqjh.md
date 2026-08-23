---
id: EX-01m0f0wn8ahv3s98t67rbytqjh
form: example
title: "The board survives a restart"
subjects:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A workspace whose lifecycle, conversation, and approval history are committed to the base ref.

## When

The board is stopped and started again.

## Then

The same read-only task timeline is reconstructed from the stored events - nothing lived only in a process's memory, and what the operator sees is derived from the repository alone.
