---
id: EX-01m0f0wn8a97ee5529c1njgfqe
form: example
title: "A hosted branch is adopted, not duplicated"
subjects:
  - BR-01m0f0wn893tdvr3b8v37qr5ck
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A hosted agent session with a single checkout on a harness-named, non-protected branch.

## When

Execution starts for a task.

## Then

That checkout is the control plane and that branch is adopted: the claim records it with origin adopted and that Kotta created neither branch nor worktree - so close and cancel later release the claim and leave the environment's branch and checkout exactly in place.
