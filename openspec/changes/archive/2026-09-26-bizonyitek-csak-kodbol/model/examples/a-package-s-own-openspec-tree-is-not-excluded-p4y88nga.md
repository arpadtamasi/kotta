---
id: EX-01m3f1eampk091v0e0p4y88nga
form: example
title: "A package's own openspec tree is not excluded"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 1. Egy szűrő, egy szabály"
  quote: "rp, 2026-09-26, chat: only the repository-root openspec/ is excluded, not a package's own openspec/."
---

## Given

A monorepo whose package `packages/billing/` keeps its own `openspec/` tree, and a file there that names an accepted node's id.

## When

`kotta gap` runs.

## Then

That file is not excluded as a copy of the specification: only the `openspec/` tree at the repository root is.
