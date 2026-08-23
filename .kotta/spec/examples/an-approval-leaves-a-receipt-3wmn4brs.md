---
id: EX-01m0f0wn8am4hb2vy03wmn4brs
form: example
title: "An approval leaves a receipt"
subjects:
  - UC-01m0f0wn89p42025mt5vg5012n
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A task in review, "Add filtered export", its evidence mapped to acceptance and its branch integrated.

## When

The calling-chat agent asks: "Close 'Add filtered export' - accepted? Yes or no?" and the operator answers yes; the agent applies the close with approval.

## Then

The task is done, and the record carries who approved, when, and on what basis - the visible yes in this conversation. Had the operator stayed silent, answered a different question, or said yes to something else earlier, the task would remain in review.
