---
id: EX-01m0f0wn8aak6ee8j0brstqsfh
form: example
title: "Fresh execution is isolated"
subjects:
  - UC-01m0f0wn89b2ymcw1c3qd4vcxb
  - BR-01m0f0wn890q5b15j7jg520yvj
---

## Given

A signed contract with no claim, in a clean repository with the control checkout on the base branch.

## When

The operator's agent runs execute with the chosen agent.

## Then

Exactly one claim, one feature branch, and one worktree exist for the contract; the brief's token count, the agent, the branch, and the worktree are reported; the launched agent receives the brief as its only input. A second plain execute is refused while the claim exists - resume is the way back in.
