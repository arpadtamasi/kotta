---
id: EX-01m0jksmhxw41vq2aa8e93k5r7
form: example
title: "Two writers, one lock"
subjects:
  - BR-01m0jksm9x99nr9vwq9qkz25ty
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

Two agents finish their tasks within the same second, each submitting a review from its own worktree, both routed to the one control checkout.

## When

Both submissions attempt the control-plane mutation at once.

## Then

One takes the lock and lands its state change and event. The other is refused with a message saying the control plane is busy and no state was changed, retries, and lands cleanly after. The canonical record contains both transitions in sequence, and neither file nor index shows an interleaved write.
