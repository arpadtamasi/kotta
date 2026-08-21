---
id: EX-01m0f0wn8a97ee5529c1njgfqe
form: example
title: "A hosted branch is adopted, not duplicated"
subjects:
  - BR-01m0f0wn893tdvr3b8v37qr5ck
---

## Given

A hosted agent session with a single checkout on a harness-named, non-protected branch.

## When

Execution starts for a task.

## Then

That checkout is the control plane and that branch is adopted: the claim records it with origin adopted and that Kotta created neither branch nor worktree - so close and cancel later release the claim and leave the environment's branch and checkout exactly in place.
