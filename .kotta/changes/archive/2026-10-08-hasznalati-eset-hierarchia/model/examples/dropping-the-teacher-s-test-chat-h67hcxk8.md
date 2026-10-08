---
id: EX-01m4ee25302x5t30r2h67hcxk8
form: example
title: "Dropping the teacher's test chat"
capability: technical-model
subjects:
  - BR-01m4ee23h66jzr4wzd0a3grf02
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# Dropping the teacher's test chat

## Given

The use case *The teacher tries the course chat* refines *Own test chat* and *Citation to the place*; *A student asks and gets a cited answer* also refines *Citation to the place*.

## When

*The teacher tries the course chat* is selected as dropped.

## Then

*Own test chat* is reported as falling out; *Citation to the place* is reported as staying, because the student's use case still refines it.
