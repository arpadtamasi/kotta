---
id: EX-01m3wa6fbrg18wtsvfrdab0wn9
form: example
title: Archive refuses a change with an unaccounted promise
subjects:
  - BR-01m3w9ajdxbf04ph4y97dmry35
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
  quote: "rp, 2026-10-01 18:02 UTC: 3 ok"
  inferred: "The operator accepted that archive refuses and names the nodes; the scene and that one admission is enough to pass are the agent's."
---
# Archive refuses a change with an unaccounted promise

## Given

An approved change whose delta adds three nodes. A test names the first, the second carries an `unimplemented` admission with its reason, and nothing names the third, which admits nothing.

## When

`kotta archive` runs on that change.

## Then

It refuses, names the third node by title and says where evidence was sought. Nothing is merged, nothing is moved and nothing is written. Once the third node is either named by the code that keeps it or admitted with a reason, the same command lands the change, asking nobody anything.
