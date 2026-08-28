---
id: UC-01m0f0wn89jqb5mpcjjt1j5j8p
form: use-case
title: "Capture an observation"
actor:
  - A-01m0f0wn89wpjph2q6xv5xrv38
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

Record a discovery outside the current scope without silently expanding active work.

## Preconditions

Something noticed during execution, review, or use: a possible bug, debt, risk, or inconsistency, with evidence at hand.

## Main success scenario

The agent records the observation with its title, type, and concrete evidence, and continues its task inside the approved scope. The observation enters the new queue for later triage. Where the noticing happened during a task, the record names that task - stated when the observation is written, or recorded afterwards on the observation that already exists, because a noticing and the naming of where it came from do not have to happen in the same breath. A link already recorded is never silently replaced: a second task is refused, naming the one the record holds. A noticing the human made is recorded as the human's: the agent relaying what was said in the conversation says so, and the record carries that origin rather than the agent's. The most valuable noticings are the ones a person makes in passing, and a workspace that can only record its agents' loses them to the conversation they were said in.

## Alternatives

The discovery blocks the task itself: the agent stops and reports the gap rather than improvising scope. External reports (a GitHub issue, user feedback) enter the same way - captured as evidence, never as scheduled work.
