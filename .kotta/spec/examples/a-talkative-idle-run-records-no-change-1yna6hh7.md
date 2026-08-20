---
id: EX-01m0f0wn8apdd1z34g1yna6hh7
form: example
title: "A talkative idle run records no-change"
subjects:
  - BR-01m0f0wn89v0rpw3p4nk0a9tx2
---

## Given

A launched agent that exits 0 and prints a confident summary of work, while the task branch tip and porcelain status are unchanged since the captured baseline.

## When

Execute compares the worktree against the baseline after the run.

## Then

The run is recorded as no-change, not implemented; the human output says so plainly and names what to check; the agent's summary is stored as reported, attributed, and not promoted into the state.
