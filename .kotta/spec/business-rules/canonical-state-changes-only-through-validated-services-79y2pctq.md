---
id: BR-01m0f0wn89r5np2yce79y2pctq
form: business-rule
title: "Canonical state changes only through validated services"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Lifecycle state, claims, events, decisions, and the generated index are written only by Kotta's validated services - via MCP tools or the CLI. They validate before writing and, on refusal, name the violated rule and the corrective action. The board is read-only. Hand-editing the process namespace is never the path.

## Rationale

Validation at the single writing seam is what lets plain files be trusted as canonical state; a second mutation surface would fork the truth.

## Scope

The process namespace and all lifecycle transitions. The spec namespace is deliberately outside: specification nodes are project-owned files, checked rather than written by the tool.
