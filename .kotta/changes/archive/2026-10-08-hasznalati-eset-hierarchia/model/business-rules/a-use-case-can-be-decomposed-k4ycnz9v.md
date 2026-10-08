---
id: BR-01m4ee22ypyq06n7vkk4ycnz9v
form: business-rule
title: A use case can be decomposed
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P1"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P5"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „belefér a standard uml use case-be?” — „igen” (to: build on include/extend, Cockburn levels, SysML refine, a supplementary specification)"
  inferred: "The UML relationships (include, extend) and Cockburn's goal levels as the way to decompose were the agent's proposal, accepted; the field names are the agent's."
---

# A use case can be decomposed

## Rule

A use case SHALL be able to name the use cases it includes (`includes`) and the use cases it extends (`extends`), as UML defines the two relationships, and MAY state its goal level (`level`: `summary`, `user-goal` or `subfunction`, after Cockburn). A use case SHALL NOT include or extend itself, directly or through others; `kotta validate` names such a cycle.

## Rationale

A single level of use cases does not fit a real product: uploading a material is one goal for the teacher, and three separate pieces of behaviour underneath. The operator asked for further hierarchy, built on what UML and the use-case literature already name, so a reader who knows them understands the model without learning Kotta's own words.

## Scope

The use-case form Kotta ships, every workspace that uses it, and the board's use-case drawing.
