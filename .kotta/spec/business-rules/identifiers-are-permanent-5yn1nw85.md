---
id: BR-01m0f0wn89c50fe1mz5yn1nw85
form: business-rule
title: "Identifiers are permanent"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

An identifier, once minted, never changes - not in renames, not in migrations, not in vocabulary changes. New identifiers are minted coordination-free (time-sortable ULIDs) so concurrent branches cannot collide; identifiers created before that rule keep their sequential form forever.

## Rationale

Links target identity. Retargeting identity is pure cost and pure risk: collision-freedom needs new mints only, and history keeps resolving as written (D-003, D-010).

## Scope

Every entity kind, every workspace, indefinitely. A workspace with both id shapes is the end state, not a transition. Human prose references entities by title; the id is the machine's and the CLI's.
