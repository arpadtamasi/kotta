---
id: EX-01m3cqmwhq6b2rvc0cwhpsay21
form: example
title: "An unknown entry still stops the migration"
capability: migration
subjects:
  - BR-01m3cqmtvgmsdxnf78babstw2c
  - UC-01m0f0wn89x00jkpqpqc2esx9h
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: Ismeretlen fájl a régi workspace-ben"
  quote: "a migráció megáll, megnevezi a bejegyzést, és semmit nem ír"
---

## Given

A directory of an older workspace shape holds an entry the migration does not know and that is not operating-system metadata.

## When

`kotta migrate` runs.

## Then

The migration stops, names the entry, and writes nothing.
