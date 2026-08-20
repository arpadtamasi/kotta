---
id: EX-01m0f0wn8avqcdz36004payzvz
form: example
title: "Work never lands on main"
subjects:
  - BR-01m0f0wn89ad55txsfkm67ks9r
---

## Given

A control checkout standing on the configured base branch, and a signed task to execute.

## When

Execution starts.

## Then

The work goes to a created feature branch named by the branch pattern, in its own worktree - never to the base branch. A protected branch is never adopted as an execution branch, and the claim schema itself rejects the default protected names (main, master, develop).
