---
id: EX-01m0f0wn8a97ee5529c1njgfqe
form: example
title: "A hosted branch is adopted, not duplicated"
subjects:
  - BR-01m0f0wn893tdvr3b8v37qr5ck
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A hosted agent session with a single checkout on a harness-named, non-protected branch.

## When

Execution starts for a task.

## Then

That checkout is the control plane and that branch is adopted: the claim records it with origin adopted and that Kotta created neither branch nor worktree - so close and cancel later release the claim and leave the environment's branch and checkout exactly in place.
