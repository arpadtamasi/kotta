---
id: E-01m0f0wn89cry06jvtwtmpk4fr
form: entity
title: "Observation"
used_by:
  - UC-01m0f0wn89jqb5mpcjjt1j5j8p
  - UC-01m0f0wn89fpwvdh3gz31cdtn9
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
---

## Meaning

Captured evidence that something may need work - from an agent mid-execution, a human note, or an external report - decoupled from the work that discovers it.

## Identity

F- plus ULID (pre-rule sequential F- ids remain). Filename: slug plus short id suffix.

## Attributes

status (new/resolved), origin (human/agent), observation_type (bug, technical-debt, risk, improvement, inconsistency, duplication, security, performance, other), confidence, severity, discovered_during, disposition, related_contract, duplicate_of.

## Invariants

Stays "new" until validated and human-dispositioned. Never becomes scheduled work by itself. The disposition carries its justification.
