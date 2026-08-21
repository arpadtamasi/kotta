---
id: EX-01m0jksmpre6y0mnwdz4t7cq18
form: example
title: "A bad pattern is refused at start"
subjects:
  - BR-01m0jksma40xmkhyt0z6ajbdhn
---

## Given

A workspace whose `git.branch_pattern` was edited to a template that renders a name Git rejects — a double slash, a trailing dot, or an empty segment.

## When

An agent starts a defined task.

## Then

Start refuses before creating claim, branch or worktree, naming the invalid rendered branch name and the pattern that produced it. Nothing is half-created, and fixing the one config line makes the same start succeed.
