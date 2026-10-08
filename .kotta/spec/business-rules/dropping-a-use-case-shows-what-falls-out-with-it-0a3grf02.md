---
id: BR-01m4ee23h66jzr4wzd0a3grf02
form: business-rule
title: Dropping a use case shows what falls out with it
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P3"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - "chat · rp, 2026-10-08 (oktat-ai session cb932801): the test-chat question"
  quote: "rp, 2026-10-08 (oktat-ai): „az nehézkes lesz, hogy ha nem vesszük át a tesztchatet mondjuk, melyik követelmény esik ki”"
  inferred: "That the dropped branch includes the use cases it includes and its extensions, unless something outside also includes them, is the agent's reading."
---

# Dropping a use case shows what falls out with it

## Rule

For a use case, Kotta SHALL tell which requirements fall out if it is dropped: every requirement whose refining use cases all lie in the dropped branch — the use case, the use cases it includes and the use cases that extend it, except one that a use case outside the branch also includes. A requirement refined by any use case outside the branch SHALL be reported as staying, and an overall requirement SHALL never fall out.

## Rationale

When one product takes over pieces of another, the question is what it takes and what it leaves behind. The operator asked that this be easy to compute; with the refining edges it is one pass over the model.

## Scope

The board's tree view and the CLI's report of the same answer.
