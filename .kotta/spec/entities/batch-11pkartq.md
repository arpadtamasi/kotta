---
id: E-01m0f0wn89mpzqng8411pkartq
form: entity
title: "Batch"
used_by:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
  - BR-01m0f0wn89tk18yzbe9x0w64tm
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Meaning

A cause-based group of tasks - and possibly of child batches - coordinated as one run with an execution mode and bounded parallelism.

## Identity

P- plus ULID (pre-rule sequential P- ids remain). Filename: slug plus short id suffix.

## Attributes

status (backlog/defined/active/done), tasks, child batches, execution (mode: sequential/parallel/dependency-aware, parallelism, stop_on_failure), coordinator (branch, worktree, base branch and commit).

## Invariants

A task belongs to at most one batch, and that batch is a leaf. A batch has at most one parent and no cycles. A parent has no coordinator branch and no execution of its own. Completing the last member completes the batch.
