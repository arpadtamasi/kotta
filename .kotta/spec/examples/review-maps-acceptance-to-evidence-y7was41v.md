---
id: EX-01m0f0wn8asqbhw5bzy7was41v
form: example
title: "Review maps acceptance to evidence"
subjects:
  - UC-01m0f0wn89dy38s6whbfa0jafn
---

## Given

An implemented contract with three acceptance conditions and a green full check set.

## When

The executing agent submits for review with the verification evidence and the pull request reference.

## Then

The contract moves to review carrying a Review evidence table over its acceptance conditions and profile checks, the verification account, and the declared deviations, observations, and known concerns - each reading "Not declared." when nothing was stated. An unclean execution worktree is refused.
