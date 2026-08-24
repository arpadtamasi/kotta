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

The agent records the observation with its title, type, and concrete evidence, and continues its task inside the approved scope. The observation enters the new queue for later triage.

## Alternatives

The discovery blocks the task itself: the agent stops and reports the gap rather than improvising scope. External reports (a GitHub issue, user feedback) enter the same way - captured as evidence, never as scheduled work.
