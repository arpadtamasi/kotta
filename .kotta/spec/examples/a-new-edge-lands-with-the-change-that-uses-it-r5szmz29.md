---
id: EX-01m4ee25mtyaj0zeh1r5szmz29
form: example
title: A new edge lands with the change that uses it
capability: technical-model
subjects:
  - BR-01m4ee245pe1wb8x8n7wxyvxwh
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# A new edge lands with the change that uses it

## Given

A change that adds the `refines` edge to the use-case form under `model/forms/use-case.yaml`, and three use cases in the same change that use it.

## When

`kotta plan`, `kotta approve` and `kotta archive` run on the change.

## Then

Plan measures the three use cases against the form with the new edge; the approval fingerprints the form with them; archive lands the form in the registry together with the nodes.
