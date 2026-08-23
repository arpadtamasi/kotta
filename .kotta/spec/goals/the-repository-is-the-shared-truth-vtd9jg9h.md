---
id: G-01m0f0wn89zx3nr6h1vtd9jg9h
form: goal
title: "The repository is the shared truth"
measured_by:
  - QA-01m0f0wn89nx49z82gh2ssx6j1
  - EX-01m0f0wn8ahv3s98t67rbytqjh
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Outcome

Canonical agreement and state live as plain files in the repository, valid across chat sessions, agents, branches, worktrees, and restarts. Chat, board, PRs, and CI are views or history, never the truth.

## Context

Local-first, no hosted service, no database, no hidden state. Git history is the audit trail.

## Baseline and target

Baseline: state scattered across chat memory and tracker UIs. Target: every entity is a file, every mutation validated and committed, every view reconstructible from the repository alone.
