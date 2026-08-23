---
id: UC-01m0f0wn89dy38s6whbfa0jafn
form: use-case
title: "Submit for review with evidence"
actor:
  - A-01m0f0wn89wpjph2q6xv5xrv38
goal:
  - G-01m0f0wn89bbzdenysa019v5x2
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Hand finished implementation to the human gate with proof, not narrative.

## Preconditions

The executing agent holds the claim; the execution worktree is clean (everything committed); acceptance conditions are verified; the full check set has run.

## Main success scenario

The agent maps each acceptance condition to concrete, reproducible evidence - test output, artifacts, measurements - names any deviations, records the pull request reference, and submits. An evidence entry may declare a runnable check (`run: <command>`); the submission executes it in the execution checkout and records the command, the commit it ran on, and its exit status with the evidence. The task moves to review.

## Alternatives

Missing evidence mapping is refused. A declared check that exits non-zero refuses the whole submission by name; the task stays active. Deviations are declared, never absorbed into a "none" boilerplate. Review acceptance itself stays with the operator - submission never implies acceptance.
