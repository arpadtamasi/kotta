---
id: BR-01m4ee23pwf0sg22vta05bc2hz
form: business-rule
title: Every requirement has a place in the hierarchy
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-10-08: „1a / 2a / 3a” — no separate home; overall is a marker on the requirement; a missing place is a warning on accepted nodes and an error on a change's nodes"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P1"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: The operator chose a warning for accepted nodes and an error for a change's nodes (3a).
---

# Every requirement has a place in the hierarchy

## Rule

Every business rule, interface and quality attribute SHALL either be refined by at least one use case or be marked overall. `kotta validate` SHALL name each one that is neither: as a warning for an accepted node, and as an error for a node a change adds or changes, so earlier models stay usable while new work lands in its place.

## Rationale

A requirement that no use case relies on and that is not overall either serves nobody the model knows of; naming it makes that visible. With the overall marker there is a place for what genuinely holds everywhere, so nothing has to be forced in.

## Scope

Every workspace using the shipped forms.
