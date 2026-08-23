---
id: GT-01m0f0wn89w5k8sk1rgegc9rxm
form: glossary-term
title: "Task"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Definition

The unit of work: one bounded, executable slice of the accepted specification, with an observable outcome, explicit scope, acceptance conditions covered by the spec nodes it references, and a verification method. The only entity that executes.

## Usage

Use for work that executes what the accepted spec already promises. A task names its coverage at define time and is closed only against accepted evidence. A task never creates agreement: a need outside its coverage becomes an observation.

## Non-examples

The agreement itself - that is the specification, the kotta. An observation (information, not work). A batch (a grouping). A spec amendment (shaping, not execution).
