---
id: EX-01m0f0wn8ad1cm1rfgb08c81ne
form: example
title: "Waves release from the coordinator"
subjects:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
---

## Given

A dependency-aware batch where contract B depends on contract A, started on its coordinator branch.

## When

A completes - done, or in review with its feature branch proven merged into the coordinator by Git ancestry.

## Then

B is created from the coordinator's current commit and that exact baseline is reported. A's own human gates are untouched: releasing B approves and closes nothing.
