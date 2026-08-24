---
id: EX-01m0jksmpre6y0mnwdz4t7cq18
form: example
title: "A bad pattern is refused at start"
subjects:
  - BR-01m0jksma40xmkhyt0z6ajbdhn
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A workspace whose `git.branch_pattern` was edited to a template that renders a name Git rejects — a double slash, a trailing dot, or an empty segment.

## When

An agent starts a defined task.

## Then

Start refuses before creating claim, branch or worktree, naming the invalid rendered branch name and the pattern that produced it. Nothing is half-created, and fixing the one config line makes the same start succeed.
