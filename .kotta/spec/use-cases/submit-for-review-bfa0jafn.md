---
id: UC-01m0f0wn89dy38s6whbfa0jafn
form: use-case
title: "Submit for review with evidence"
actor:
  - A-01m0f0wn89wpjph2q6xv5xrv38
goal:
  - G-01m0f0wn89bbzdenysa019v5x2
---

## Intent

Hand finished implementation to the human gate with proof, not narrative.

## Preconditions

The executing agent holds the claim; the execution worktree is clean (everything committed); acceptance conditions are verified; the full check set has run.

## Main success scenario

The agent maps each acceptance condition to concrete, reproducible evidence - test output, artifacts, measurements - names any deviations, records the pull request reference, and submits. The task moves to review.

## Alternatives

Missing evidence mapping is refused. Deviations are declared, never absorbed into a "none" boilerplate. Review acceptance itself stays with the operator - submission never implies acceptance.
