---
id: EX-01m3f1eaacp45n4b5r5h170c3n
form: example
title: "An uncommitted specification file is not offered as evidence"
capability: evidence
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
  - UC-01m0fpqfxjvet99wbz0v1ag64q
provenance:
  level: inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/planning.md · (c) judged"
  quote: "Does the uncommitted-path hint go through the same filter?"
  inferred: "The agent decided that the gap hint about uncommitted paths reads through the evidence filter; it follows from the rule, the operator did not rule on it."
---

## Given

An accepted node that nothing committed names, and an uncommitted `openspec/changes/<name>/planning.md` and change spec in the working tree that mention its id.

## When

`kotta gap` runs.

## Then

The node is refused as unaccounted for, and the hint about uncommitted paths that could carry the missing evidence does not name the planning report or the change spec: an uncommitted copy of the specification cannot carry evidence either.
