---
id: BR-01m0fp2hdkwaqamzj5b9wke276
form: business-rule
title: "What the tool enforces, the spec states"
---

## Rule

Every rule the tool enforces is written in the specification, and everything the specification requires is checked by the tool: validate reads the spec graph and fails on a broken reference, a missing required edge, or a published schema nothing checks.

## Rationale

An unwritten rule enforced in three places drifts three ways; a schema nothing checks is documentation pretending to be a gate. The pairing keeps the spec truthful and the tool explainable.

## Scope

kotta validate, the JSON schemas the workspace publishes, and every refusal message: a refusal names the violated rule as the spec states it.
