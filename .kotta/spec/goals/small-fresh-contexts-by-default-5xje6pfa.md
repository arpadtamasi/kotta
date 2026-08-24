---
id: G-01m0f0wn89hek1751b5xje6pfa
form: goal
title: "Small fresh contexts by default"
measured_by:
  - QA-01m0f0wn8981atnptrbdqa19y2
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Outcome

Each task executes in a fresh agent context whose only intent input is its brief. The coordinator stays thin; context carry-over is an explicit, logged exception.

## Context

Measured before the model existed: 88% of consumption ran in 150k+ contexts. A self-contained task cannot require the whole history - if it does, the task is incomplete (D-009).

## Baseline and target

Baseline: one growing session carries all work. Target: per-task briefs, deterministic and token-counted, with a warning threshold that treats an overweight brief as a task defect.
