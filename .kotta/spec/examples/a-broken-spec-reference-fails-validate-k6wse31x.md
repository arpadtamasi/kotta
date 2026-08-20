---
id: EX-01m0fp2hdkyxnkk3wvk6wse31x
form: example
title: "A broken spec reference fails validate"
subjects:
  - BR-01m0fp2hdkwaqamzj5b9wke276
---

## Given

A workspace whose goal names a measuring quality attribute that was deleted in a refactor.

## When

kotta validate runs.

## Then

Validation fails, naming the goal, the dangling edge, and the corrective action - a broken reference in the spec graph is never a green result.
