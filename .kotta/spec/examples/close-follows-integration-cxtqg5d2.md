---
id: EX-01m0f0wn8a519hbe2qcxtqg5d2
form: example
title: "Close follows integration"
subjects:
  - UC-01m0f0wn89vwta48p95exahgmv
---

## Given

A reviewed contract whose feature branch is merged into the base branch, with acceptance verified.

## When

The operator says yes to closing it, and the agent applies close with approval.

## Then

The contract is done with resolution completed; the claim is released, the worktree removed, and the merged branch deleted. The same close attempted before the merge is refused naming the integration requirement.
