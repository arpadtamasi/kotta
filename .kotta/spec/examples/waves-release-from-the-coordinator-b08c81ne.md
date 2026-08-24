---
id: EX-01m0f0wn8ad1cm1rfgb08c81ne
form: example
title: "Waves release from the coordinator"
subjects:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A dependency-aware batch where task B depends on task A, started on its coordinator branch.

## When

A completes - done, or in review with its feature branch proven merged into the coordinator by Git ancestry.

## Then

B is created from the coordinator's current commit and that exact baseline is reported. A's own human gates are untouched: releasing B approves and closes nothing.
