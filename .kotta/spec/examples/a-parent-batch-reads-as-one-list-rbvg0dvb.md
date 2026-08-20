---
id: EX-01m0f0wn8ay5vp7841rbvg0dvb
form: example
title: "A parent batch reads as one list"
subjects:
  - BR-01m0f0wn89tk18yzbe9x0w64tm
---

## Given

A parent batch grouping two child batches for one larger product effort.

## When

Its status is read, and a start of the parent is attempted.

## Then

Status reports every contract in the subtree in dependency order - the list an agent works leaf by leaf - while start refuses the parent: no coordinator branch, no execution of its own, every member contract still passing its own gates.
