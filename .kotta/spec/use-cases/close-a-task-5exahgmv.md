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
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

End work that was finished, accepted, and integrated - releasing its resources safely.

## Preconditions

Accepted review, the feature branch integrated into the base branch, acceptance conditions verified.

## Main success scenario

The operator says yes to closing, named by title. Close verifies the gate conditions, marks the task done with resolution completed, releases the claim, removes the execution worktree, and deletes the merged feature branch - safe to delete precisely because the merge is proven. Only cancel preserves a branch, because a cancelled branch was never merged.

## Alternatives

Unintegrated or unaccepted work is refused with the violated rule named. Resources Kotta did not create - an adopted branch and checkout - are left exactly where they were found.
