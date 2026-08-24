---
id: SM-01m0f0wn89m2xwd4z4mk9p71d5
form: state-machine
title: "Batch lifecycle"
entity:
  - E-01m0f0wn89mpzqng8411pkartq
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Governed lifecycle

How a group of tasks is coordinated from definition to integrated cleanup.

## States

backlog - defined - active (running on its coordinator branch coord/<id>) - done. Derived reporting states: unstarted, active, done-unintegrated, cleanup-pending, blocked-*, cleaned.

## Transitions

backlog -> defined: batch validate - the batch becomes defined when validation passes, with no separate approval, exactly as a task does. Validation refuses while any member is neither backlog, defined nor done. The agreement a batch expresses is the agreement its members already carry; grouping approves nothing, so there is nothing here for a human to sign. defined -> active: batch start creates the coordinator branch and worktree from the base branch (or adopts an already checked-out coordinator) and releases the first wave. Waves advance as dependencies complete - done, or in review with the feature branch proven merged into the coordinator. last direct member terminal -> done: automatic, whether or not the batch was started; a parent completes through explicit batch close, which checks the whole subtree - child batches and tasks alike - and refuses while any is not done, naming it. After the coordinator merges to base: finalize verifies ancestry, fast-forwards the base checkout to its remote when needed, removes the clean worktree, deletes the merged branch - and refuses anything it cannot prove safe. Member gates are never bypassed by any batch transition.
