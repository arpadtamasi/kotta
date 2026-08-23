---
id: BR-01m0f0wn893tdvr3b8v37qr5ck
form: business-rule
title: "The environment's checkout is respected"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Where exactly one checkout exists, it is the control plane on whatever branch it holds. An existing non-protected branch is adopted rather than duplicated - Kotta names and creates a branch only when there is nothing to adopt. What Kotta did not create, it never cleans up.

## Rationale

A hosted session or a solo developer's checkout already has one legitimate place for the work; creating a parallel branch and worktree would split it, and deleting the host's checkout on close would destroy what was never Kotta's (D-01kztv9y, D-01kztvgb).

## Scope

Control-plane resolution, start, execute, close, and cancel. The claim records created versus adopted so cleanup can tell them apart. Protected branches are never adopted.
