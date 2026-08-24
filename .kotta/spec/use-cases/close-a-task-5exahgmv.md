---
id: UC-01m0f0wn89vwta48p95exahgmv
form: use-case
title: "Close a finished task"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bbzdenysa019v5x2
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

End work that was finished, accepted, and integrated - releasing its resources safely.

## Preconditions

Accepted review, the feature branch integrated into the base branch, acceptance conditions verified.

## Main success scenario

The operator says yes to closing, named by title. Close verifies the gate conditions, marks the task done with resolution completed, releases the claim, removes the execution worktree, and deletes the merged feature branch - safe to delete precisely because the merge is proven. Only cancel preserves a branch, because a cancelled branch was never merged.

## Alternatives

Unintegrated or unaccepted work is refused with the violated rule named. Resources Kotta did not create - an adopted branch and checkout - are left exactly where they were found.
