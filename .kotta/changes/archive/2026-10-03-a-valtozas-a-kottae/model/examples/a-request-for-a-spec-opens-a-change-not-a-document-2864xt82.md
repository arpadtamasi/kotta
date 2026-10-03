---
id: EX-01m40e0b1b9rpw2jwr2864xt82
form: example
title: "A request for a spec opens a change, not a document"
capability: planning-phase
subjects:
  - BR-01m40e0afjevd5jy04135bh7fj
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P1"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ1"
  quote: "rp, 2026-09-29: „a projektben meg nincs openspec - kértem specet és csak kotta lett”"
  inferred: "The concrete flow is the agent's illustration of the two failures the operator reported."
---

# A request for a spec opens a change, not a document

## Given

A Kotta workspace with no `openspec/` folder, and a human asking the agent for a spec of a demo application.

## When

The agent starts on the request.

## Then

It runs `kotta change new`, writes the proposal into `.kotta/changes/<name>/proposal.md` and drafts the nodes into that change's `model/`. No `SPEC.md` and no `openspec/` folder is created, and `kotta change list` names the change.
