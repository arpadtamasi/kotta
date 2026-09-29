---
id: EX-01m3cqmv7e9rjkte4g40kqm294
form: example
title: "A generated binding is neither cited nor a test"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Generált narratív spec"
  quote: "a kötés nem `cited` és nem `bound` szintű bizonyíték, és a generált fájl nem számít tesztfájlnak"
---

## Given

A generated `openspec/specs/<capability>/spec.md` carries a `<!-- kotta: ID -->` binding under a requirement, and nothing else in the repository names that id.

## When

`kotta gap` runs.

## Then

The binding is neither `cited` nor `bound` evidence, the node reads `none`, and the generated file is not counted as a test file although its path contains `specs/`.
