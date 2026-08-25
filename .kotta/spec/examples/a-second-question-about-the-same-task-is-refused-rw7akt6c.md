---
id: EX-01m0vqr9k6c4d77g48rw7akt6c
form: example
title: "A second question about the same task is refused"
subjects:
  - BR-01m0vqr9k5ypcztw4v0ns2qa6a
---

## Given

A task in review, "Add filtered export", with a close already put to the operator and not yet answered.

## When

The agent prepares a second gated action on the same task - retiring it as obsolete - before the close is answered.

## Then

The second proposal is refused, naming the close as the action already waiting, and no elicitation reaches the operator. Had the agent instead repeated the close under the same request id, it would have received the approval already recorded, not a second one.
