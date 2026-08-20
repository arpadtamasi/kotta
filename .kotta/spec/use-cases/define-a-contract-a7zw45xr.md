---
id: UC-01m0f0wn89tta6w4w3a7zw45xr
form: use-case
title: "Define a contract"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
interfaces:
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
  - IF-01m0f0wn8994dzf9z1sdygxa04
---

## Intent

Turn stated intent into a validated, executable contract the operator has signed for execution.

## Preconditions

An initialized workspace. Intent stated in conversation (or an observation dispositioned create-contract). Agent-created contracts only where config allows.

## Main success scenario

Intent is captured as a backlog contract with its type and profiles. The calling-chat agent investigates the repository, drafts outcome, scope, acceptance conditions and verification, and applies it. Validation passes - every required section and profile requirement present, Open decisions saying none remain. The agent asks the operator by title, in one line; on an explicit yes it signs with approval. The contract is defined.

## Alternatives

Validation fails: the violated rule and corrective action are named; the contract stays backlog - a validation failure is never a defined contract. A real unresolved choice in Open decisions blocks signing until decided (possibly as a decision record).
