---
id: EX-01m0f0wn8ad1cm1rfgb08c81ne
form: example
title: "Waves release from the coordinator"
subjects:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A dependency-aware batch where task B depends on task A, started on its coordinator branch.

## When

A completes - done, or in review with its feature branch proven merged into the coordinator by Git ancestry.

## Then

B is created from the coordinator's current commit and that exact baseline is reported. A's own human gates are untouched: releasing B approves and closes nothing.
