---
id: BR-01m0vqr9k5ypcztw4v0ns2qa6a
form: business-rule
title: "One entity carries one undecided approval"
---

## Rule

An entity may carry at most one approval that has been put to the human and not yet answered. While a proposal on an entity has reached no terminal phase - applied, rejected, cancelled or failed - a second proposal on that same entity is refused, and the refusal names the action already waiting. Repeating an identical request, identified by the caller's own request id, returns the approval already recorded rather than creating a second one.

## Rationale

Two open questions about one entity make the human's yes ambiguous: neither the agent nor the record can say which question it answered, and the receipt would link a visible response to a decision the person may not have had in mind. A single undecided approval keeps every yes attributable to exactly one transition. Idempotence exists for the same reason from the other side: a retried request is the same question, and asking it twice would manufacture a second gate out of a lost connection.

## Scope

Every approval-carrying mutation on every surface. The rule is about undecided proposals only: an entity may accumulate any number of decided approvals over its life, and a decided one never blocks the next.
