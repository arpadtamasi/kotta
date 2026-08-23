---
id: GT-01m0f0wn89vnd0kvyyetttpydj
form: glossary-term
title: "Control plane"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Definition

The checkout where canonical lifecycle state, claims, decisions, and events are written: the worktree holding the configured base branch - or, where exactly one checkout exists, that checkout on whatever branch it holds.

## Usage

Commands invoked from any linked worktree route state changes to the control plane. Feature worktrees carry implementation, never a divergent lifecycle copy.

## Non-examples

A feature worktree. The board (a read-only view). Whatever directory happens to be the current one.
