---
id: EX-01m0jksmhxw41vq2aa8e93k5r7
form: example
title: "Two writers, one lock"
subjects:
  - BR-01m0jksm9x99nr9vwq9qkz25ty
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

Two agents finish their tasks within the same second, each submitting a review from its own worktree, both routed to the one control checkout.

## When

Both submissions attempt the control-plane mutation at once.

## Then

One takes the lock and lands its state change and event. The other is refused with a message saying the control plane is busy and no state was changed, retries, and lands cleanly after. The canonical record contains both transitions in sequence, and neither file nor index shows an interleaved write.
