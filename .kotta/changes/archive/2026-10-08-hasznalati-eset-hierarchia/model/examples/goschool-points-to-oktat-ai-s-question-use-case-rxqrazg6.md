---
id: EX-01m4ee25tytddkyyq4rxqrazg6
form: example
title: "GoSchool points to oktat-ai's question use case"
capability: technical-model
subjects:
  - BR-01m4ee24bfc9zgkjrmwkjgwwrj
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# GoSchool points to oktat-ai's question use case

## Given

In the GoSchool workspace, a use case *The learner asks the tutor* with a `reference:` block naming oktat-ai, a version, and the id of oktat-ai's *A student asks and gets a cited answer*.

## When

`kotta modules check` runs in GoSchool.

## Then

It resolves the reference to oktat-ai's use case; had that use case changed since the pinned version, it would report the reference as stale.
