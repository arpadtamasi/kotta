---
id: EX-01m0f0wn8avqcdz36004payzvz
form: example
title: "Work never lands on main"
subjects:
  - BR-01m0f0wn89ad55txsfkm67ks9r
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A control checkout standing on the configured base branch, and a signed task to execute.

## When

Execution starts.

## Then

The work goes to a created feature branch named by the branch pattern, in its own worktree - never to the base branch. A protected branch is never adopted as an execution branch, and the claim schema itself rejects the default protected names (main, master, develop).
