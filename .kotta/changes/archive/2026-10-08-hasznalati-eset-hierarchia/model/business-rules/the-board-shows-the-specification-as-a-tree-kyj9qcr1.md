---
id: BR-01m4ee23zg0wx6hyvpkyj9qcr1
form: business-rule
title: The board shows the specification as a tree
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · SZ2"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P3"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
  quote: "rp, 2026-10-08: „a kotta ui is nehezen áttekinthető így”"
  inferred: "The layout — actor, use cases nested by include and extend, requirements under each, overall on top, unplaced apart, capability as a filter — follows the draft view the operator approved on 2026-10-08 (artifact Ma2wgwjsvECybuiLbbX98s)."
---

# The board shows the specification as a tree

## Rule

The board SHALL offer a view of the specification as a tree: the overall requirements at the top, then each actor with its use cases, a use case's included and extending use cases nested under it, and under each use case the requirements it refines, each with the number of its examples. Requirements that have no place SHALL be listed apart. A use case SHALL be selectable as dropped, and the board SHALL then mark what falls out and what stays. The capability SHALL filter the tree, never group it.

## Rationale

A flat list by form is hard to read at a few hundred nodes: the rule and the use case it serves never stand side by side. The operator looked at the oktat-ai specification laid out this way and found it right.

## Scope

`kotta ui`, beside the existing views.
