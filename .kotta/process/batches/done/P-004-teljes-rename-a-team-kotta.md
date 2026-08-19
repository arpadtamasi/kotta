---
id: P-004
title: 'Teljes rename: a-team → kotta'
status: done
contracts:
  - T-020
  - T-021
  - T-023
  - T-022
execution:
  mode: dependency-aware
  parallelism: 1
  stop_on_failure: true
authority:
  create_observations: true
  create_subcontracts: false
  reorder_independent_contracts: false
  change_scope: false
created_at: '2026-08-01'
updated_at: '2026-08-03'
coordinator:
  branch: coord/P-004
  base_branch: main
  base_commit: b40be85fde341e05193370f96d243e132b4d7de3
  cleaned_at: '2026-08-03'
---
# P-004 — Teljes rename: a-team → kotta

## Goal

A termék minden felülete és a szomszéd workspace-ek is Kotta néven futnak: npm, CLI, könyvtár, szótár — egyetlen, sorrendezett körben.

## Completion

All member tickets satisfy their acceptance contracts.

## Execution notes

Membership and ordering are coordinated by a human.
