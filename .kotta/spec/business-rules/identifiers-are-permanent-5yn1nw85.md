---
id: BR-01m0f0wn89c50fe1mz5yn1nw85
form: business-rule
title: "Identifiers are permanent"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

An identifier, once minted, never changes - not in renames, not in migrations, not in vocabulary changes. New identifiers are minted coordination-free (time-sortable ULIDs) so concurrent branches cannot collide; identifiers created before that rule keep their sequential form forever.

## Rationale

Links target identity. Retargeting identity is pure cost and pure risk: collision-freedom needs new mints only, and history keeps resolving as written (D-003, D-010).

## Scope

Every entity kind, every workspace, indefinitely. A workspace with both id shapes is the end state, not a transition. Human prose references entities by title; the id is the machine's and the CLI's.
