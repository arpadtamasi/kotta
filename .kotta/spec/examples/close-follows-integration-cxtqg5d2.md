---
id: EX-01m0f0wn8a519hbe2qcxtqg5d2
form: example
title: "Close follows integration"
subjects:
  - UC-01m0f0wn89vwta48p95exahgmv
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A reviewed task whose feature branch is merged into the base branch, with acceptance verified.

## When

The operator says yes to closing it, and the agent applies close with approval.

## Then

The task is done with resolution completed; the claim is released, the worktree removed, and the merged branch deleted. The same close attempted before the merge is refused naming the integration requirement.
