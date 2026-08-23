---
id: BR-01m0f0wn89tk18yzbe9x0w64tm
form: business-rule
title: "Batch nesting is grouping only"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

A parent batch is a name its children roll up into: it has no coordinator branch, no execution block, no merge target, and batch start never runs it. A batch has at most one parent, cycles are forbidden, and tasks belong to leaf batches only.

## Rationale

Carrying out "the whole big thing" is a conversational request over a readable tree, not a new execution machine - the expensive questions (what a child coordinator merges into, layered parallelism, half-done children) never arise (D-01kztxvp).

## Scope

Batch structure and every reader: parent status flattens the subtree into dependency order so an agent can work it task by task, each through its own gates.
