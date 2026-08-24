---
id: BR-01m0fp2hdkwaqamzj5b9wke276
form: business-rule
title: "What the tool enforces, the spec states"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

Every rule the tool enforces is written in the specification, and everything the specification requires is checked by the tool: validate reads the spec graph and fails on a broken reference, a missing required edge, or a published schema nothing checks.

## Rationale

An unwritten rule enforced in three places drifts three ways; a schema nothing checks is documentation pretending to be a gate. The pairing keeps the spec truthful and the tool explainable.

## Scope

kotta validate, the JSON schemas the workspace publishes, and every refusal message: a refusal names the violated rule as the spec states it.
