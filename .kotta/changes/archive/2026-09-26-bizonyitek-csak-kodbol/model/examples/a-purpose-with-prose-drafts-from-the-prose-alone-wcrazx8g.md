---
id: EX-01m3cqmw5eyqbr0bt3wcrazx8g
form: example
title: "A Purpose with prose drafts from the prose alone"
capability: migration
subjects:
  - BR-01m3cqmtnnwxz7fkyr6d5ch9e6
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose szöveget és megjegyzést is tartalmaz"
  quote: "az import a prózából vázol goal-t, a megjegyzés nélkül"
---

## Given

A capability's `## Purpose` holds prose and a Markdown comment beside it.

## When

`kotta import openspec` runs.

## Then

The import drafts a goal from the prose, and the comment appears nowhere in the draft.
