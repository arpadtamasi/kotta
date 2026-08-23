---
id: BR-01m0f0wn89ad55txsfkm67ks9r
form: business-rule
title: "Execution never touches a protected branch"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Implementation never runs on the base branch or any configured protected branch, and a protected branch is never adopted as an execution branch. This rule outranks branch adoption.

## Rationale

The base branch is the canonical state and the integration target; executing on it would collapse the distinction between proposal and truth.

## Scope

All task and batch execution. Start refuses to adopt a checkout on a configured protected branch and never mints an execution branch named in git.protected_branches; a single checkout on a protected branch is a canonical writer, not an execution site.
