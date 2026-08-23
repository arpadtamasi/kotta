---
id: EX-01m0fp2hdkyxnkk3wvk6wse31x
form: example
title: "A broken spec reference fails validate"
subjects:
  - BR-01m0fp2hdkwaqamzj5b9wke276
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A workspace whose goal names a measuring quality attribute that was deleted in a refactor.

## When

kotta validate runs.

## Then

Validation fails, naming the goal, the dangling edge, and the corrective action - a broken reference in the spec graph is never a green result.
