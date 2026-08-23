---
id: SM-01m0f0wn89m2xwd4z4mk9p71d5
form: state-machine
title: "Batch lifecycle"
entity:
  - E-01m0f0wn89mpzqng8411pkartq
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Governed lifecycle

How a group of tasks is coordinated from definition to integrated cleanup.

## States

backlog - defined - active (running on its coordinator branch coord/<id>) - done. Derived reporting states: unstarted, active, done-unintegrated, cleanup-pending, blocked-*, cleaned.

## Transitions

backlog -> defined: batch sign - a human-approved gate that refuses while any member is neither backlog, defined nor done, or any executable frontier task is unsigned. defined -> active: batch start creates the coordinator branch and worktree from the base branch (or adopts an already checked-out coordinator) and releases the first wave. Waves advance as dependencies complete - done, or in review with the feature branch proven merged into the coordinator. last direct member terminal -> done: automatic, whether or not the batch was started; a parent completes through explicit batch close, which checks the whole subtree - child batches and tasks alike - and refuses while any is not done, naming it. After the coordinator merges to base: finalize verifies ancestry, fast-forwards the base checkout to its remote when needed, removes the clean worktree, deletes the merged branch - and refuses anything it cannot prove safe. Member gates are never bypassed by any batch transition.
