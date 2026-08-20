---
id: SM-01m0f0wn892ntx934by9gwednb
form: state-machine
title: "Observation lifecycle"
entity:
  - E-01m0f0wn89cry06jvtwtmpk4fr
---

## Governed lifecycle

How discovered information waits for and receives a human triage outcome.

## States

new (captured with evidence, undispositioned) - resolved (dispositioned, with justification).

## Transitions

new -> resolved: validate (investigation, deduplication) followed by a human-approved resolve carrying one disposition: create-contract, attach-to-existing-contract, investigate, accept-risk, reject, or merge-duplicate (gate). Nothing moves an observation into work by itself; create-contract feeds the contract lifecycle at backlog.
