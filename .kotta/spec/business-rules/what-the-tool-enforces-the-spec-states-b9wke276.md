---
id: BR-01m0fp2hdkwaqamzj5b9wke276
form: business-rule
title: "What the tool enforces, the spec states"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Every rule the tool enforces is written in the specification, and everything the specification requires is checked by the tool: validate reads the spec graph and fails on a broken reference, a missing required edge, or a published schema nothing checks.

## Rationale

An unwritten rule enforced in three places drifts three ways; a schema nothing checks is documentation pretending to be a gate. The pairing keeps the spec truthful and the tool explainable.

## Scope

kotta validate, the JSON schemas the workspace publishes, and every refusal message: a refusal names the violated rule as the spec states it.
