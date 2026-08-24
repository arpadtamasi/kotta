---
id: BR-01m0f0wn89ad55txsfkm67ks9r
form: business-rule
title: "Execution never touches a protected branch"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

Implementation never runs on the base branch or any configured protected branch, and a protected branch is never adopted as an execution branch. This rule outranks branch adoption.

## Rationale

The base branch is the canonical state and the integration target; executing on it would collapse the distinction between proposal and truth.

## Scope

All task and batch execution. Start refuses to adopt a checkout on a configured protected branch and never mints an execution branch named in git.protected_branches; a single checkout on a protected branch is a canonical writer, not an execution site.
