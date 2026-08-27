---
id: E-01m0f0wn89cry06jvtwtmpk4fr
form: entity
title: "Observation"
used_by:
  - UC-01m0f0wn89jqb5mpcjjt1j5j8p
  - UC-01m0f0wn89fpwvdh3gz31cdtn9
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Meaning

Captured evidence that something may need work - from an agent mid-execution, a human note, or an external report - decoupled from the work that discovers it.

## Identity

F- plus ULID (pre-rule sequential F- ids remain). Filename: slug plus short id suffix.

## Attributes

status (new/resolved), origin (human/agent), observation_type (bug, technical-debt, risk, improvement, inconsistency, duplication, security, performance, other), confidence, severity, discovered_during, disposition, related_task, duplicate_of.

## Invariants

Stays "new" until validated and human-dispositioned. Never becomes scheduled work by itself. The disposition carries its justification. Every attribute an observation carries is a judgement someone made about this observation: the party capturing it gives it a value, or the attribute does not exist. A field the tool fills with the same constant on every capture records nothing, reads as information, and costs the attention of everyone who trusts it.
