---
id: BR-01m4ee24bfc9zgkjrmwkjgwwrj
form: business-rule
title: A use case can point to a use case in another repository
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · SZ1"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
  quote: "rp, 2026-10-08 (oktat-ai): „a goschool kottában azt mondom, itt a chat, a feltöltés meg a még nem tudom mi”"
  inferred: "Extending the existing cross-repository reference, which today serves interfaces only, to use cases is the agent's proposal."
---

# A use case can point to a use case in another repository

## Rule

A use case SHALL be able to carry the same `reference:` block an interface carries today — the module, the version it relies on, and the foreign use case's id — to state that another repository provides it. `kotta modules check` SHALL resolve it and report a stale or missing reference as it does for an interface.

## Rationale

One product builds on another's pieces: GoSchool wants to say that its chat and its upload are oktat-ai's. Today only an interface can point across repositories; a use case can only name the other one in prose, unchecked.

## Scope

The use-case form Kotta ships and `kotta modules check`.
