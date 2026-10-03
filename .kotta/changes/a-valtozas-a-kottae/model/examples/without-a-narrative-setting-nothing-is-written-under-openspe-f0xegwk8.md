---
id: EX-01m40e0bcp9ebc3tf7f0xegwk8
form: example
title: Without a narrative setting nothing is written under openspec
capability: planning-phase
subjects:
  - BR-01m40e0ankvnv82me5emp1hf25
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ1"
  quote: "rp, 2026-09-29: „a kottában nem kell megtartani az openspecet, csak mint lehetséges alapot”"
  inferred: "The case is the agent's: the default it chose, shown at archive."
---

# Without a narrative setting nothing is written under openspec

## Given

A workspace whose config sets no `narrative:`, and an approved change with a business rule written in Hungarian without SHALL or MUST.

## When

`kotta plan`, then `kotta archive` run on the change.

## Then

Plan accepts the rule as written and reports no narrative drift; archive lands the rule in `.kotta/spec/`, moves the change to `.kotta/changes/archive/`, and no `openspec/` folder exists afterwards.
