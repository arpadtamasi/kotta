---
id: BR-01m4gg8vnq75d4rkw1e0x1b734
form: business-rule
title: "A goal can serve a goal"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ2"
    - "chat · rp, 2026-10-09 13:5x, answer to a structured question: „Séma + board együtt” (the goal form gets a goal-serves-goal edge, the use cases an order, the board builds on them) and „Mind az öt” (all five board findings)"
  quote: "rp, 2026-10-09: „inkább az az érdekes, hogy az elmondásod jó volt, a hierarchia meg ezek szerint más”"
  inferred: "The operator chose that the goal form gets an edge for one goal serving another. Its name (serves), its direction (from the narrower goal to the wider one), that it is optional and acyclic are the agent's."
---
# A goal can serve a goal

## Rule

The goal form Kotta ships SHALL let a goal name the goals it serves (`serves`), from the narrower goal to the wider one, and SHALL declare the edge optional and acyclic, so that `kotta validate` names a goal that serves itself, directly or through others.

## Rationale

A product has one purpose and narrower outcomes under it; goal-oriented requirements engineering calls this goal refinement (KAOS, i*). The word `refines` is taken — it is the use case's edge to the requirements it relies on — so the goal's edge is named for what the narrower goal does: it serves the wider one. Without it every goal is a sibling of every other: the intimity import made eight equal goals, one per capability, and "it can be installed on the home screen" stood level with "the result never exposes one partner". The purpose a human tells in one sentence had nowhere to live.

## Scope

The goal form Kotta ships. A workspace that already has its own registry gains the edge the way any form change lands: through a change that carries the form (*A form change goes through the gate*).
