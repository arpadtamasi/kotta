---
id: UC-01m0f0wn89tta6w4w3a7zw45xr
form: use-case
title: "Define a task"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
interfaces:
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
  - IF-01m0f0wn8994dzf9z1sdygxa04
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Turn stated intent into a validated, executable task covered by the accepted specification.

## Preconditions

An initialized workspace with an accepted specification. Intent stated in conversation (or an observation dispositioned create-task). Agent-created tasks only where config allows.

## Main success scenario

Intent is captured as a backlog task with its type and profiles. The calling-chat agent investigates the repository and the spec, drafts outcome, scope, acceptance conditions and verification, and names the accepted spec nodes the task executes. Validation passes - every required section present, Open decisions saying none remain, every acceptance condition covered by a referenced accepted node. The task is defined; no sign gate follows, because the agreement was accepted when the spec landed.

## Alternatives

Validation fails: the violated rule and corrective action are named; the task stays backlog - a validation failure is never a defined task. An acceptance condition with no coverage: the gap travels the human line - an observation and, on approval, a spec amendment - and the task waits. A real unresolved choice in Open decisions blocks defining until decided (possibly as a decision record). Until a claim exists, define may amend the task - title included - and validation re-checks on every amendment.
