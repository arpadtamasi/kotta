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
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

Hand finished implementation to the human gate with proof, not narrative.

## Preconditions

The executing agent holds the claim; the execution worktree is clean (everything committed); acceptance conditions are verified; the full check set has run.

## Main success scenario

The agent maps each acceptance condition to concrete, reproducible evidence - test output, artifacts, measurements - names any deviations, records the pull request reference, and submits. An evidence entry may declare a runnable check (`run: <command>`); the submission executes it in the execution checkout and records the command, the commit it ran on, and its exit status with the evidence. The task moves to review.

## Alternatives

Missing evidence mapping is refused. A declared check that exits non-zero refuses the whole submission by name; the task stays active. Deviations are declared, never absorbed into a "none" boilerplate. Review acceptance itself stays with the operator - submission never implies acceptance.
