---
id: UC-01m4kbzhamtpt9gybc9kz6vbrx
form: use-case
title: "Archive a built change"
level: user-goal
actor:
  - A-01m0f0wn89w35y4k8nngzgemz8
goal:
  - G-01m0f0wn89zx3nr6h1vtd9jg9h
refines:
  - BR-01m3w9ajdxbf04ph4y97dmry35
  - BR-01m4at3x2fffqepx85tmvf3hxw
accepted:
  - "structural: kept by the commands its steps name and the rules it refines, each evidenced on its own"
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/kotta-celja-es-menete/conversation.md · K2"
    - "templates/AGENTS.md · Rules for agents"
  quote: "rp, 2026-10-10: „Igen, két új eset”"
  inferred: "2026-10-10 (migracio-helye): serves its own goal, not the purpose directly, so that the purpose is served through its goals and support can stand beside the journey; the agent's. The operator chose that building and archiving are steps of the journey; the steps are the rules file's own, the wording is the agent's."
---
# Archive a built change

## Intent

The agent closes a built change, landing exactly the delta the human approved in the accepted specification.

## Preconditions

An approved change, open in the workspace.

## Main success scenario

1. The agent runs `kotta archive <name>`.
2. Kotta lands the approved delta and moves the change to the archive, refusing a node that is neither kept nor admitted.

## Alternatives

None.
