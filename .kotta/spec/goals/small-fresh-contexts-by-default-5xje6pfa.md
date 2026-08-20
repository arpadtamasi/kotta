---
id: G-01m0f0wn89hek1751b5xje6pfa
form: goal
title: "Small fresh contexts by default"
measured_by:
  - QA-01m0f0wn8981atnptrbdqa19y2
---

## Outcome

Each contract executes in a fresh agent context whose only intent input is its brief. The coordinator stays thin; context carry-over is an explicit, logged exception.

## Context

Measured before the model existed: 88% of consumption ran in 150k+ contexts. A self-contained contract cannot require the whole history - if it does, the contract is incomplete (D-009).

## Baseline and target

Baseline: one growing session carries all work. Target: per-contract briefs, deterministic and token-counted, with a warning threshold that treats an overweight brief as a contract defect.
