---
id: IF-01m0f0wn89efd2ss83c4csk7qx
form: interface
title: "The agent launch task"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Purpose

The boundary between execute and the coding agent it launches: what the agent receives, what authority it gets, and how its run is judged.

## Preconditions

A defined task (signed as well, where the workspace retains the compatibility gate); a clean repository; the agent command resolved from the agent argument or the environment override (which is how tests drive a deterministic double).

## Postconditions

The agent is launched with the brief as its only intent input. The run's baseline and result are compared and appended as one execution record; the claim records the agent that actually ran.

## Invariants

The caller's context never reaches a fresh run; carry-over requires a declared, logged reason appended as a deviation. Permission mode is passed only when the operator configured one - by default the agent's own project settings decide, so a run never receives authority the caller had not already granted.

## Failures

A mode that forbids edits by definition is refused at launch naming the cause. Non-zero exit or empty output is agent-failed with claim and worktree kept. An interrupt terminates the agent and names what to decide by hand.
