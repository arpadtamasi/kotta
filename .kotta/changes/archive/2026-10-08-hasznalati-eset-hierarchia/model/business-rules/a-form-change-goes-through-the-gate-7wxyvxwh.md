---
id: BR-01m4ee245pe1wb8x8n7wxyvxwh
form: business-rule
title: A form change goes through the gate
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "Found while planning this change: the new edges are form changes, and form files today land outside any change."
---

# A form change goes through the gate

## Rule

A change SHALL be able to carry form definitions under `model/forms/`. `kotta plan` SHALL measure the delta's nodes against the registry as the change would leave it, `kotta approve` SHALL fingerprint the forms with the nodes, and `kotta archive` SHALL land them in the registry. A form edited in the registry outside a change SHALL be reported by `kotta validate`.

## Rationale

The form registry decides what every node must say and which edges it answers; changing it changes the agreement as much as changing a node. Today a form change lands by hand, with no gate, and a change that uses a new edge cannot even be measured before the form is in place.

## Scope

Every change and the form registry of every workspace.
