---
id: G-01m0f0wn89hek1751b5xje6pfa
form: goal
title: "Small fresh contexts by default"
measured_by:
  - QA-01m0f0wn8981atnptrbdqa19y2
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Outcome

Each task executes in a fresh agent context whose only intent input is its brief. The coordinator stays thin; context carry-over is an explicit, logged exception.

## Context

Measured before the model existed: 88% of consumption ran in 150k+ contexts. A self-contained task cannot require the whole history - if it does, the task is incomplete (D-009).

## Baseline and target

Baseline: one growing session carries all work. Target: per-task briefs, deterministic and token-counted, with a warning threshold that treats an overweight brief as a task defect.
