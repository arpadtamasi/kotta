---
id: EX-01m3cqmvk8vfym9tmj34zfdx6p
form: example
title: "A node named only in the specification belongs to no module"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 3. Modul-levezetés ugyanazon a szűrőn"
    - "openspec/changes/bizonyitek-csak-kodbol/tasks.md · 1.3"
  quote: "egy csak `openspec/` alatt említett node besorolatlan, nem `(root)`"
---

## Given

An accepted node whose id appears only under `openspec/` — an archived change, an `approval.yaml`, a generated narrative spec — and in no module's files.

## When

The module derivation runs (`kotta modules`).

## Then

The node is unassigned. It is not placed in the `(root)` pseudo-module because of where the specification's copy lies.
