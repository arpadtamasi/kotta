---
id: EX-01m0f0wn8asqbhw5bzy7was41v
form: example
title: "Review maps acceptance to evidence"
subjects:
  - UC-01m0f0wn89dy38s6whbfa0jafn
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

An implemented task with three acceptance conditions and a green full check set.

## When

The executing agent submits for review with the verification evidence and the pull request reference.

## Then

The task moves to review carrying a Review evidence table over its acceptance conditions and profile checks, the verification account, and the declared deviations, observations, and known concerns - each reading "Not declared." when nothing was stated. An unclean execution worktree is refused.
