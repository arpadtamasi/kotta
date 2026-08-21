---
id: UC-01m0f0wn89fpwvdh3gz31cdtn9
form: use-case
title: "Resolve an observation"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
---

## Intent

Give discovered information a deliberate, justified outcome.

## Preconditions

A validated observation: investigated, deduplicated, and with enough decision context gathered.

## Main success scenario

The operator says yes to the proposed disposition, named by title. Resolve records the disposition with its justification and the approval receipt, and moves the observation to resolved. An amend-spec disposition changes the agreement: the amended spec nodes land on the base branch, and the landed delta yields the tasks. A create-task disposition feeds the define path; it never mints a defined task directly.

## Alternatives

Duplicates merge into their original. Accepted risks record why the risk is acceptable. Rejection records why the observation does not warrant work.
