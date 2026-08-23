---
id: EX-01m0f0wn8a519hbe2qcxtqg5d2
form: example
title: "Close follows integration"
subjects:
  - UC-01m0f0wn89vwta48p95exahgmv
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A reviewed task whose feature branch is merged into the base branch, with acceptance verified.

## When

The operator says yes to closing it, and the agent applies close with approval.

## Then

The task is done with resolution completed; the claim is released, the worktree removed, and the merged branch deleted. The same close attempted before the merge is refused naming the integration requirement.
