---
id: BR-01m0f0wn890q5b15j7jg520yvj
form: business-rule
title: "One task, one claim, one branch, one worktree"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

An active task has exactly one claim binding it to one agent, one feature branch, and one implementation worktree. Parallel work uses separate worktrees.

## Rationale

Isolation is what makes concurrent delegation safe: no shared mutable checkout, no ambiguity about where work lives, no second agent racing the first.

## Scope

All execution, fresh or inherited. A second plain execute on a claimed task is refused; resume is the path back into an existing context.
