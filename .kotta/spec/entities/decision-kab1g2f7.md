---
id: E-01m0f0wn891kye4debkab1g2f7
form: entity
title: "Decision"
used_by:
  - BR-01m0f0wn89fvfj4z3c1pkv7t9j
  - UC-01m0f0wn89tta6w4w3a7zw45xr
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Meaning

A durable, human-approved answer to a product or process question - the ADR of the workspace. Decisions are the memory that keeps agents from re-asking or inventing intent.

## Identity

D- plus sequential number or ULID; the canonical filename is the identity alone, so titles cannot race around it.

## Attributes

id, title, date; body sections Decision, Context, Consequences.

## Invariants

Created only with explicit human approval. Never overwritten - a change of mind is a new decision that names what it supersedes. Referenced decisions travel into task briefs.
