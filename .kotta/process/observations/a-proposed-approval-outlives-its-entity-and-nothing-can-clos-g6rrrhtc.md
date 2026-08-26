---
id: F-01m0yta2mqnm3pw84vg6rrrhtc
title: 'A proposed approval outlives its entity, and nothing can close it'
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
---
# F-01m0yta2mqnm3pw84vg6rrrhtc — A proposed approval outlives its entity, and nothing can close it

## Observation

A proposed approval outlives its entity, and nothing can close it.

## Evidence

The first honest run of kotta sweep on this workspace surfaced two approvals proposed on 2026-08-05 and never answered: task.request-changes on T-01kz8tk2t53jbax6mrseka50v9 and task.sign on T-01kz9de36qw55z9g73ynebm578. Both tasks are now done with resolution completed - the work finished another way and the proposals were left behind. They will sit in the event log forever: proposeApproval refuses a second proposal while one is undecided, so a stale proposal also blocks the entity from ever being proposed for anything again; decideApproval requires a human answer; and failApproval is not reachable from any surface. One of the two names task.sign, an action removed on 2026-08-25, so it could not be applied even if answered. BR-01m0vqr9k64ht9h70fpjy6rky9 says a proposal that no longer names a possible transition is refused when it is prepared - it says nothing about one already prepared, which is the case measured here.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
