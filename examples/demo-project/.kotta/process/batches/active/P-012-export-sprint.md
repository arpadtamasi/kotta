---
id: P-012
title: Export sprint
status: active
contracts:
  - T-014
  - T-015
  - T-018
execution:
  mode: dependency-aware
  parallelism: 2
  stop_on_failure: true
authority:
  create_observations: true
  create_subcontracts: false
  reorder_independent_contracts: true
  change_scope: false
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# P-012 — Export sprint

## Goal

Deliver a filtered export flow with observable job status and auditable requests.

## Completion

- `T-014`, `T-015`, and `T-018` are accepted and done.
- Every claim, feature branch, and worktree is released after integration.
- Findings discovered during execution have an explicit disposition.

## Execution notes

- Planning found no dependency cycle; `T-014` and `T-015` could start in
  parallel, up to the limit of two isolated worktrees.
- `T-014` used branch `kotta/T-014-add-filtered-export` and worktree
  `.worktrees/T-014`; both were cleaned after merge.
- `T-014` is done. `T-015` remains ready. `T-018` depended on `T-014` and is now
  unblocked and ready.
- `F-032` was captured without changing package scope. Its resulting `T-019`
  remains outside this package.
