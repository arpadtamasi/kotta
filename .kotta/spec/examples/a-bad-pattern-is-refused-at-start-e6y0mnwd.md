---
id: EX-01m0jksmpre6y0mnwdz4t7cq18
form: example
title: "A bad pattern is refused at start"
subjects:
  - BR-01m0jksma40xmkhyt0z6ajbdhn
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A workspace whose `git.branch_pattern` was edited to a template that renders a name Git rejects — a double slash, a trailing dot, or an empty segment.

## When

An agent starts a defined task.

## Then

Start refuses before creating claim, branch or worktree, naming the invalid rendered branch name and the pattern that produced it. Nothing is half-created, and fixing the one config line makes the same start succeed.
