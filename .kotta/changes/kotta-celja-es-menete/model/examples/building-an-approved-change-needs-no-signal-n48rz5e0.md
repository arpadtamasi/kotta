---
id: EX-01m3wa6fk1b8anb3dxn48rz5e0
form: example
title: Building an approved change needs no signal
subjects:
  - UC-01m4kbzh3rt3sjwmb49km5j1db
  - BR-01m3kdq88m3bgye3xnn9q6hsr2
  - BR-01m0fp2hdkfn519h1w84jsrqbe
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P7"
    - ".kotta/changes/archive/2026-10-06-a-motor-maradek-igeretei/proposal.md · What changes"
  quote: "rp, 2026-10-01 18:02 UTC: 4 ok"
  inferred: "The scene - water logging in an approved change - is taken from the health-ai conversation and worded by the agent."
---
# Building an approved change needs no signal

## Given

An approved change, still open, one of whose user stories promises that water can be logged. The accepted model says nothing about water.

## When

The agent writes the code that logs water, naming the story's id where the code keeps it.

## Then

The agent writes the code and opens no change: the promise is stated by the approved change. Had no approved change stated it, the agent would have opened a change and waited for the gate before writing the code.
