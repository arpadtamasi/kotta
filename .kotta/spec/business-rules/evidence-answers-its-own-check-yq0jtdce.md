---
id: BR-01m0fp2hdkj0ba2vzsyq0jtdce
form: business-rule
title: "Evidence answers its own check"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Each evidence entry answers the specific check it is filed under. Identical evidence pasted into more than one check of the same task is a validation failure, and an entry stating its check was not performed can never satisfy that check.

## Rationale

A gate that accepts volume where it asked for fitness is not a filter: nine tasks in one workspace passed review with one blob pasted into every named row - one of which literally declared the check undone.

## Scope

Review submission and the close gate, on every surface. Applies to the acceptance-to-evidence mapping: one acceptance condition, one answering piece of evidence, verifiable from the repository.
