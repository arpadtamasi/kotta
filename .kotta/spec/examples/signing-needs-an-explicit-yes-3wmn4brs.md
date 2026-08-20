---
id: EX-01m0f0wn8am4hb2vy03wmn4brs
form: example
title: "Signing needs an explicit yes"
subjects:
  - UC-01m0f0wn89p42025mt5vg5012n
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
---

## Given

A validated backlog contract, "Add filtered export", whose Open decisions section says none remain.

## When

The calling-chat agent asks: "Sign 'Add filtered export' for execution - yes or no?" and the operator answers yes; the agent applies the sign with approval.

## Then

The contract is defined and the receipt links the visible yes. Had the operator stayed silent, answered a different question, or said yes to something else earlier, the contract would remain unsigned.
