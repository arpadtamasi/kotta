---
id: F-015
title: >-
  A-Team's default framing is waterfall-ish — make discovery-first / provisional
  plans first-class
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-31'
---
# F-015 — A-Team's default framing is waterfall-ish — make discovery-first / provisional plans first-class

## Observation

A-Team's default framing is waterfall-ish — make discovery-first / provisional plans first-class.

## Evidence

Surfaced running a real greenfield project (flowbench, 2026-07-31). A big upfront plan (14 build tickets ordered skeleton→corpus→…→run→eval) reads as waterfall: the largest unknowns (does the corpus exist? is there a measurable signal between arms? does graph extraction work?) sit at the END, so linear execution reveals what wasn't clarified only after the infrastructure is built. The operator's point: run it agile — a prototyping/discovery round FIRST, and treat the build plan as provisional.

A-Team already has the PRIMITIVES for this: the 'discovery' profile is a bounded, time-boxed spike that supports a decision (supported_decision / research_question / hypotheses / method / time_or_depth_limit / expected_output / decision_criterion), and findings (learnings) + decisions (clarifications) are the feedback loop that re-shapes tickets. We used exactly this: flowbench T-015 is a discovery 'walking-skeleton' spike created before T-001…T-014.

But the default framing does not MAKE this the path: (1) there is no first-class spike/prototype package kind (kinds are sprint/milestone/batch/mission) to hold a discovery round; (2) nothing signals that a big backlog is provisional-until-a-spike-runs; (3) no guidance nudges 'start with discovery, let findings/decisions re-shape the plan'. Proposal: add a 'spike'/'discovery' package kind (or bless a discovery-package pattern), and add a discovery-first principle + shaping guidance so the plan is explicitly provisional until the riskiest-assumption spike runs. Live example + template: flowbench T-015.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
