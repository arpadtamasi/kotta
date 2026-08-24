---
id: EX-01m0fp2hdkyxnkk3wvk6wse31x
form: example
title: "A broken spec reference fails validate"
subjects:
  - BR-01m0fp2hdkwaqamzj5b9wke276
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A workspace whose goal names a measuring quality attribute that was deleted in a refactor.

## When

kotta validate runs.

## Then

Validation fails, naming the goal, the dangling edge, and the corrective action - a broken reference in the spec graph is never a green result.
