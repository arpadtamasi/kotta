---
id: EX-01m4ee24hbczjt2k76pn2cq2wm
form: example
title: Uploading a material is three use cases
capability: technical-model
subjects:
  - BR-01m4ee22ypyq06n7vkk4ycnz9v
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "The case is the agent's illustration, drawn from the oktat-ai specification."
---

# Uploading a material is three use cases

## Given

The use case *A teacher uploads a material and it becomes searchable*, at level `user-goal`.

## When

It names under `includes` *The system processes the material* and *The material becomes searchable*, both at level `subfunction`, and *Choosing the image mode* names it under `extends`.

## Then

`kotta validate` accepts the three edges; the board draws the two included use cases and the extension under it. Had *The material becomes searchable* also included the upload use case, `kotta validate` would name the cycle.
