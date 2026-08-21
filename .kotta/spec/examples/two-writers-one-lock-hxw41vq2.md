---
id: EX-01m0jksmhxw41vq2aa8e93k5r7
form: example
title: "Two writers, one lock"
subjects:
  - BR-01m0jksm9x99nr9vwq9qkz25ty
---

## Given

Two agents finish their tasks within the same second, each submitting a review from its own worktree, both routed to the one control checkout.

## When

Both submissions attempt the control-plane mutation at once.

## Then

One takes the lock and lands its state change and event. The other is refused with a message saying the control plane is busy and no state was changed, retries, and lands cleanly after. The canonical record contains both transitions in sequence, and neither file nor index shows an interleaved write.
