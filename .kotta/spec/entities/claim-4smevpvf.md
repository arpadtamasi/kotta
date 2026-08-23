---
id: E-01m0f0wn89m9p7h9fv4smevpvf
form: entity
title: "Claim"
used_by:
  - UC-01m0f0wn89b2ymcw1c3qd4vcxb
  - BR-01m0f0wn890q5b15j7jg520yvj
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Meaning

The live link between an active task and its execution: who runs it, on which branch, in which worktree, and whether Kotta created that isolation or adopted the environment's.

## Identity

One YAML file per active task under the process namespace, keyed by the task id.

## Attributes

task, agent, branch, worktree, execution_mode (fresh/inherited), origin (created/adopted), start ref and start commit, started_at, session id.

## Invariants

At most one claim per task. The claim's branch is never a protected branch. Review, close, and cancel read the claim - so it must record the truth about what was created versus adopted, because only created resources may be cleaned up.
