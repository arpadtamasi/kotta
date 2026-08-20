---
id: EX-01m0fp2hdkw7ka6wh3byyc9sd2
form: example
title: "A noticing amends the spec"
subjects:
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
  - BR-01m0fp2hdkfn519h1w84jsrqbe
  - UC-01m0f0wn89fpwvdh3gz31cdtn9
---

## Given

An observation with evidence that review evidence is satisfied by volume, not fitness.

## When

The operator approves the amend-spec disposition; the business rule "Evidence answers its own check" is amended into the spec and lands on the base branch.

## Then

The observation is resolved without minting any task directly; the landed delta - the amended rule - is what defines the next task.
