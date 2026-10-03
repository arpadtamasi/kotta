---
id: BR-01m414skt0pcqb668azj7czkeq
form: business-rule
title: A state machine written as one paragraph is still drawn
provenance:
  level: inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-rajzol/conversation.md · SZ5"
  quote: "rp, 2026-10-03: „a state machine nem jó”"
  inferred: "What was wrong was read by the agent: the operator's state machine wrote its three transitions in one paragraph and the board drew none; one transition began at a condition, not a state. The cut at sentence ends and the condition rule are the agent's."
---
# A state machine written as one paragraph is still drawn

## Rule

When a state machine's Transitions section holds several `A → B: why` transitions in one paragraph,
each beginning a sentence, the board SHALL draw each of them; an arrow mentioned in the middle of a
sentence SHALL stay prose. When the States section names the states and a transition's end is not
among them, the board SHALL draw that end as a condition ("when …"), never as a state.

## Rationale

A lifecycle written as running prose is still a lifecycle; drawing nothing hid it, and drawing a
condition as a state would claim a state the specification does not have.

## Scope

The state machine view, with either renderer.
