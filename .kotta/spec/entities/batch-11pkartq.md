---
id: E-01m0f0wn89mpzqng8411pkartq
form: entity
title: "Batch"
used_by:
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
  - BR-01m0f0wn89tk18yzbe9x0w64tm
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Meaning

A cause-based group of tasks - and possibly of child batches - coordinated as one run with an execution mode and bounded parallelism.

## Identity

P- plus ULID (pre-rule sequential P- ids remain). Filename: slug plus short id suffix.

## Attributes

status (backlog/defined/active/done), tasks, child batches, execution (mode: sequential/parallel/dependency-aware, parallelism, stop_on_failure), coordinator (branch, worktree, base branch and commit).

## Invariants

A task belongs to at most one batch, and that batch is a leaf. A batch has at most one parent and no cycles. A parent has no coordinator branch and no execution of its own. Completing the last member completes the batch.
