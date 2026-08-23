---
id: E-01m0f0wn891kye4debkab1g2f7
form: entity
title: "Decision"
used_by:
  - BR-01m0f0wn89fvfj4z3c1pkv7t9j
  - UC-01m0f0wn89tta6w4w3a7zw45xr
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Meaning

A durable, human-approved answer to a product or process question - the ADR of the workspace. Decisions are the memory that keeps agents from re-asking or inventing intent.

## Identity

D- plus sequential number or ULID; the canonical filename is the identity alone, so titles cannot race around it.

## Attributes

id, title, date; body sections Decision, Context, Consequences.

## Invariants

Created only with explicit human approval. Never overwritten - a change of mind is a new decision that names what it supersedes. Referenced decisions travel into task briefs.
