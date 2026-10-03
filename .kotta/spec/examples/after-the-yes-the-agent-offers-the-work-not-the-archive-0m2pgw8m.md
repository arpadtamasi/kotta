---
id: EX-01m3w9ajm1gfn90q2a0m2pgw8m
form: example
title: 'After the yes the agent offers the work, not the archive'
subjects:
  - BR-01m3w9ajdxbf04ph4y97dmry35
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/proposal.md · Why"
  quote: "rp, 2026-10-01 17:34 UTC: archive nem a fejleszés után kell? miért ajánlottad fel?"
  inferred: "The scene is the health-ai exchange the operator objected to, turned around; that the agent says the change stays open is the agent's wording."
---
# After the yes the agent offers the work, not the archive

## Given

A planned change with no open decision, six of whose user stories no code keeps yet. The human says yes at the gate, and the agent records it with `kotta approve`.

## When

The agent says what comes next.

## Then

It offers to build what the change describes, and says that the change stays open until that is done. It neither runs `kotta archive` nor offers it as the next step. `kotta change list` still lists the change as open.
