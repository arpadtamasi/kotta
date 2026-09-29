---
id: EX-01m3cqmvz6thtctkdd760f1n2b
form: example
title: "A comment-only Purpose drafts no goal"
capability: migration
subjects:
  - BR-01m3cqmtnnwxz7fkyr6d5ch9e6
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose csak a generátor megjegyzését tartalmazza"
  quote: "az import nem készít goal-vázlatot a képességhez, és a figyelmeztetései között megnevezi, hogy a képesség célja nincs kimondva"
---

## Given

An `openspec/specs/<capability>/spec.md` whose `## Purpose` holds only the generator's `<!-- … -->` comment.

## When

`kotta import openspec` runs.

## Then

No goal is drafted for that capability, and among its warnings the import names the capability as one whose purpose is not stated.
