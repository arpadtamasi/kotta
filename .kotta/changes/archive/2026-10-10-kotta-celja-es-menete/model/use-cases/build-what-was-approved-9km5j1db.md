---
id: UC-01m4kbzh3rt3sjwmb49km5j1db
form: use-case
title: "Build what was approved"
level: user-goal
actor:
  - A-01m0f0wn89w35y4k8nngzgemz8
goal:
  - G-01m4kbetcrer5bjb75djba5sct
refines:
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
  - BR-01m0qtshfqhcrrqtz051zm9svr
accepted:
  - "structural: kept by the commands its steps name and the rules it refines, each evidenced on its own"
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/kotta-celja-es-menete/conversation.md · K2"
    - "templates/AGENTS.md · Rules for agents"
  quote: "rp, 2026-10-10: „Igen, két új eset”"
  inferred: "The operator chose that building and archiving are steps of the journey; the steps are the rules file's own, the wording is the agent's."
---
# Build what was approved

## Intent

The agent writes the code an approved change describes, naming in the code and in its tests every promise it keeps, so the human sees what is kept while it is built.

## Preconditions

An approved change, open in the workspace.

## Main success scenario

1. The agent reads what is left of the change with `kotta gap --change <name>`.
2. It writes the code and the tests, citing each node it keeps.
3. It runs `kotta gap` until nothing of the change is left without evidence or an admission.

## Alternatives

None.
