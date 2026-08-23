---
id: GT-01m0jksma4w2aqeeasvp8d8393
form: glossary-term
title: "Roadmap"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Definition

The roadmap is a convention, not an entity: goal nodes state why and toward what, and nested batches state when and with what, in dependency order. Reading the goals with `kotta batch status` on the parent batches is reading the roadmap.

## Usage

"Put it on the roadmap" means: name or amend the goal it serves, and place the work in a batch under the parent that carries that horizon. A roadmap review is a read of goals and batch subtrees, not a separate document.

## Non-examples

A dated Gantt commitment; a standalone roadmap.md that drifts from the workspace; a priority field nothing reads. If a horizon needs a date, that is a goal's measure or a batch's constraint, stated where it is checked.
