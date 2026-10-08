---
id: EX-01m4ee258z2d2chy2atcq4ken0
form: example
title: A rule nothing places is named
capability: technical-model
subjects:
  - BR-01m4ee23pwf0sg22vta05bc2hz
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# A rule nothing places is named

## Given

A rule *Slug format* that no use case refines and that is not marked overall.

## When

`kotta validate` runs.

## Then

It names *Slug format* as having no place in the hierarchy, with the two ways to give it one: a use case that refines it, or the overall marker.
