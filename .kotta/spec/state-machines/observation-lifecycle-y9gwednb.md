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

new -> resolved: validate (investigation, deduplication) followed by a human-approved resolve carrying one disposition: amend-spec, create-task, attach-to-existing-task, investigate, accept-risk, reject, or merge-duplicate (gate, receipt recorded). Nothing moves an observation into work by itself. amend-spec changes the accepted agreement - it is refused unless the resolution names at least one amended spec node that resolves, the amended spec lands on the base branch, and the landed delta yields the tasks; create-task feeds the task lifecycle at backlog. attach-to-existing-task is the same shape from the other side: it is refused unless the resolution names the task it attaches to and that task resolves, and the resolved observation records it. A disposition whose meaning is a reference is not recorded without the reference.
