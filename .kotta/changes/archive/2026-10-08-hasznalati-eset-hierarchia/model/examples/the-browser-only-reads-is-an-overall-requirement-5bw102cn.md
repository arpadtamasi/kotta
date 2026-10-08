---
id: EX-01m4ee24wn2str3e4x5bw102cn
form: example
title: The browser only reads is an overall requirement
capability: technical-model
subjects:
  - BR-01m4ee23baq19gd87ez4m9zxdw
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# The browser only reads is an overall requirement

## Given

The rule *The browser only reads*, marked overall, refined by no use case.

## When

The model is validated and every use case is dropped in turn.

## Then

`kotta validate` does not name the rule as lacking a place, and no drop ever reports it as falling out.
