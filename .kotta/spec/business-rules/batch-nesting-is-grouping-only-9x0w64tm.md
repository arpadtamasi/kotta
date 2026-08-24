---
id: BR-01m0f0wn89tk18yzbe9x0w64tm
form: business-rule
title: "Batch nesting is grouping only"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

A parent batch is a name its children roll up into: it has no coordinator branch, no execution block, no merge target, and batch start never runs it. A batch has at most one parent, cycles are forbidden, and tasks belong to leaf batches only.

## Rationale

Carrying out "the whole big thing" is a conversational request over a readable tree, not a new execution machine - the expensive questions (what a child coordinator merges into, layered parallelism, half-done children) never arise (D-01kztxvp).

## Scope

Batch structure and every reader: parent status flattens the subtree into dependency order so an agent can work it task by task, each through its own gates.
