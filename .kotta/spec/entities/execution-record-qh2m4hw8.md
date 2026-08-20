---
id: E-01m0f0wn89r885ytmkqh2m4hw8
form: entity
title: "Execution record"
used_by:
  - BR-01m0f0wn89v0rpw3p4nk0a9tx2
  - UC-01m0f0wn89b2ymcw1c3qd4vcxb
---

## Meaning

The append-only account of one execution run of a task: what was launched, against which baseline, and what the repository shows it did.

## Identity

One event per run appended to the task's event stream; a resume appends a new record instead of rewriting the previous one.

## Attributes

resolved state (implemented, no-change, agent-failed, or cancelled on interrupt), agent and command, run duration and reported token usage, baseline and resulting commit, whether uncommitted changes remain, exit code, and the agent's own printed output - stored as reported, attributed, never promoted into the state decision.

## Invariants

The state is derived from the baseline comparison, not from the agent's narrative. Unrelated dirt in the control worktree cannot discard a completed run's record.
