---
id: EX-01m3cqmwbbgp3q325eee22m627
form: example
title: "Finder metadata does not stop the migration"
capability: migration
subjects:
  - BR-01m3cqmtvgmsdxnf78babstw2c
  - UC-01m0f0wn89x00jkpqpqc2esx9h
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: Finder-metaadat a régi workspace-ben"
  quote: "a migráció lefut, a fájl nem kerül az archívumba, és a terv megnevezi, hogy figyelmen kívül hagyta"
---

## Given

A v2 workspace whose `batches/` directory holds a `.DS_Store` file.

## When

`kotta migrate` runs.

## Then

The migration completes, the `.DS_Store` is not carried into the archive, and the plan names it as ignored.
