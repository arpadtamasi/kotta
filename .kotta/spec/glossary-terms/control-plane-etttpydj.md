---
id: GT-01m0f0wn89vnd0kvyyetttpydj
form: glossary-term
title: "Control plane"
---

## Definition

The checkout where canonical lifecycle state, claims, decisions, and events are written: the worktree holding the configured base branch - or, where exactly one checkout exists, that checkout on whatever branch it holds.

## Usage

Commands invoked from any linked worktree route state changes to the control plane. Feature worktrees carry implementation, never a divergent lifecycle copy.

## Non-examples

A feature worktree. The board (a read-only view). Whatever directory happens to be the current one.
