---
id: EX-01m0f0wn8ay5vp7841rbvg0dvb
form: example
title: "A parent batch reads as one list"
subjects:
  - BR-01m0f0wn89tk18yzbe9x0w64tm
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A parent batch grouping two child batches for one larger product effort.

## When

Its status is read, and a start of the parent is attempted.

## Then

Status reports every task in the subtree in dependency order - the list an agent works leaf by leaf - while start refuses the parent: no coordinator branch, no execution of its own, every member task still passing its own gates.
