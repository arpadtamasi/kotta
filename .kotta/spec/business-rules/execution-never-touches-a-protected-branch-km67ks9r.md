---
id: BR-01m0f0wn89ad55txsfkm67ks9r
form: business-rule
title: "Execution never touches a protected branch"
---

## Rule

Implementation never runs on the base branch or any configured protected branch, and a protected branch is never adopted as an execution branch. This rule outranks branch adoption.

## Rationale

The base branch is the canonical state and the integration target; executing on it would collapse the distinction between proposal and truth.

## Scope

All task and batch execution. The claim schema itself rejects protected branch names; a single checkout on a protected branch is a canonical writer, not an execution site.
