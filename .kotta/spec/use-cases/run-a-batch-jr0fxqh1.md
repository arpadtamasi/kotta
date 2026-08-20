---
id: UC-01m0f0wn89jebbfp6rjr0fxqh1
form: use-case
title: "Run a batch"
actor:
  - A-01m0f0wn89w35y4k8nngzgemz8
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
---

## Intent

Coordinate related tasks as one dependency-aware run without weakening any per-task gate.

## Preconditions

A validated, signed leaf batch of defined tasks; the control checkout on the base branch.

## Main success scenario

Batch start creates the coordinator branch coord/<id> in its own worktree, records the baseline, and releases the first wave within the configured parallelism. Each completed dependency releases the next wave, created from the coordinator's current commit. Completing the last member completes the batch; after the coordinator merges, finalize proves safety by Git ancestry and cleans up.

## Alternatives

A dependency in review releases the next wave only when Git proves its branch is already in the coordinator. A parent batch never starts: its status reports every task underneath in dependency order, and the calling-chat agent works that flattened list, leaf by leaf. Stop-on-failure halts wave release. A dirty worktree, active claim, held branch, or diverged base stops finalize with an explanation and changes nothing.
