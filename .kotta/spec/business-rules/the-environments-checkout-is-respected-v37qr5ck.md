---
id: BR-01m0f0wn893tdvr3b8v37qr5ck
form: business-rule
title: "The environment's checkout is respected"
---

## Rule

Where exactly one checkout exists, it is the control plane on whatever branch it holds. An existing non-protected branch is adopted rather than duplicated - Kotta names and creates a branch only when there is nothing to adopt. What Kotta did not create, it never cleans up.

## Rationale

A hosted session or a solo developer's checkout already has one legitimate place for the work; creating a parallel branch and worktree would split it, and deleting the host's checkout on close would destroy what was never Kotta's (D-01kztv9y, D-01kztvgb).

## Scope

Control-plane resolution, start, execute, close, and cancel. The claim records created versus adopted so cleanup can tell them apart. Protected branches are never adopted.
