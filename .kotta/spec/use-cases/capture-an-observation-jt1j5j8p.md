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
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Record a discovery outside the current scope without silently expanding active work.

## Preconditions

Something noticed during execution, review, or use: a possible bug, debt, risk, or inconsistency, with evidence at hand.

## Main success scenario

The agent records the observation with its title, type, and concrete evidence, and continues its task inside the approved scope. The observation enters the new queue for later triage.

## Alternatives

The discovery blocks the task itself: the agent stops and reports the gap rather than improvising scope. External reports (a GitHub issue, user feedback) enter the same way - captured as evidence, never as scheduled work.
