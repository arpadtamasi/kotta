---
id: BR-01m0f0wn89r5np2yce79y2pctq
form: business-rule
title: "Canonical state changes only through validated services"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

Lifecycle state, claims, events, decisions, and the generated index are written only by Kotta's validated services - via MCP tools or the CLI. They validate before writing and, on refusal, name the violated rule and the corrective action. A service that writes canonical state commits it: a mutation that leaves its own writes uncommitted turns the workspace dirty behind the operator, and the next command refuses work they did not cause. A refusal names what is true — a service never reports the operator's checkout as unclean when the uncommitted change is its own. The board is read-only. Hand-editing the process namespace is never the path.

## Rationale

Validation at the single writing seam is what lets plain files be trusted as canonical state; a second mutation surface would fork the truth.

## Scope

The process namespace and all lifecycle transitions. The spec namespace is deliberately outside: specification nodes are project-owned files, checked rather than written by the tool.
