---
id: UC-01m0f0wn8909cgbsm6d3dkzjcw
form: use-case
title: "Cancel objectless work"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

Retire work whose purpose is gone - superseded, duplicated, or abandoned - so the record says what killed it, not only that it ended.

## Preconditions

A task in any state before done whose purpose no longer holds (often because a decision made it objectless).

## Main success scenario

The operator says yes to cancelling, named by title. Cancel records the resolution and the reason - duplicate and obsolete also name the task or decision that took the work's place - releases the claim, and removes the execution worktree. The branch is never deleted, because a cancelled branch was never merged.

## Alternatives

Closing objectless work as completed is a false record and is not done; neither is leaving it sitting in active. Cancel is the only exit for a task a decision made objectless. A terminal task returns through reopen, never through a second cancel; an unclean worktree refuses the cancellation; tasks that depended on the retired one are reported, never cascaded.
