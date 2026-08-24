---
id: EX-01m0f0wn8ay5vp7841rbvg0dvb
form: example
title: "A parent batch reads as one list"
subjects:
  - BR-01m0f0wn89tk18yzbe9x0w64tm
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A parent batch grouping two child batches for one larger product effort.

## When

Its status is read, and a start of the parent is attempted.

## Then

Status reports every task in the subtree in dependency order - the list an agent works leaf by leaf - while start refuses the parent: no coordinator branch, no execution of its own, every member task still passing its own gates.
