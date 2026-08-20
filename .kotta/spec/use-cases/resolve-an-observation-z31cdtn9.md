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

The operator says yes to the proposed disposition, named by title. Resolve records the disposition with its justification and moves the observation to resolved. A create-contract disposition feeds the define path; it never mints a defined contract directly.

## Alternatives

Duplicates merge into their original. Accepted risks record why the risk is acceptable. Rejection records why the observation does not warrant work.
