---
id: E-01m0f0wn89mpzqng8411pkartq
form: entity
title: "Batch"
used_by:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
  - BR-01m0f0wn89tk18yzbe9x0w64tm
---

## Meaning

A cause-based group of contracts - and possibly of child batches - coordinated as one run with an execution mode and bounded parallelism.

## Identity

P- plus ULID (pre-rule sequential P- ids remain). Filename: slug plus short id suffix.

## Attributes

status (backlog/defined/active/done), contracts, child batches, execution (mode: sequential/parallel/dependency-aware, parallelism, stop_on_failure), coordinator (branch, worktree, base branch and commit).

## Invariants

A contract belongs to at most one batch, and that batch is a leaf. A batch has at most one parent and no cycles. A parent has no coordinator branch and no execution of its own. Completing the last member completes the batch.
