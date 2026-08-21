---
id: F-007
title: >-
  Triage-assistant agent: gather decision context for a finding and propose a
  justified disposition
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-26'
---
# F-007 — Triage-assistant agent: gather decision context for a finding and propose a justified disposition

## Observation

Triage-assistant agent: gather decision context for a finding and propose a justified disposition.

## Evidence

The operator's real triage bottleneck is context-gathering, not the disposition buttons. Stated directly this session: 'épp az a baj általában, hogy nincs infóm gyorsan a döntéshez' — the problem is not having information fast enough to decide.

Grounding:
- one&a workspace real data (2026-07-26): 43/52 legacy findings were dispositioned 'attach-existing' — most observations belong to work that ALREADY exists, so the decisive question at triage is 'what does this relate to?' (dup? existing ticket? which code?). Native dispositions skew to create-ticket, but the relate-vs-new judgement is the same context problem.
- A disposition is only the OUTCOME of triage; the reasoning/justification is the real artifact and must be recorded (generalises the accept-risk -> decision-record instinct to every disposition).

Proposed capability: a triage assistant agent that, when a finding lands, pre-gathers the decision context — duplicate candidates, related findings/tickets, the code it touches, and blast radius — and PROPOSES a justified disposition the operator accepts or overrides. Reduces triage from a manual investigation to a review.

Dependencies: requires F-006 fixed (reliable derived reads to gather context); benefits from dedup/clustering. See D-002 for the surrounding triage decisions and D-001 for the derivation model. Relates to F-005 (the detail view should surface the gathered context + the justification).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
