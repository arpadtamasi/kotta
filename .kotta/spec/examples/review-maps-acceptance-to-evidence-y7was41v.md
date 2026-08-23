---
id: EX-01m0f0wn8asqbhw5bzy7was41v
form: example
title: "Review maps acceptance to evidence"
subjects:
  - UC-01m0f0wn89dy38s6whbfa0jafn
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

An implemented task with three acceptance conditions and a green full check set.

## When

The executing agent submits for review with the verification evidence and the pull request reference.

## Then

The task moves to review carrying a Review evidence table over its acceptance conditions and profile checks, the verification account, and the declared deviations, observations, and known concerns - each reading "Not declared." when nothing was stated. An unclean execution worktree is refused.
