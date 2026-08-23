---
id: BR-01m0f0wn890q5b15j7jg520yvj
form: business-rule
title: "One task, one claim, one branch, one worktree"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

An active task has exactly one claim binding it to one agent, one feature branch, and one implementation worktree. Parallel work uses separate worktrees.

## Rationale

Isolation is what makes concurrent delegation safe: no shared mutable checkout, no ambiguity about where work lives, no second agent racing the first.

## Scope

All execution, fresh or inherited. A second plain execute on a claimed task is refused; resume is the path back into an existing context.
