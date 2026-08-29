---
id: F-01m14eq1kjmxz28f01k1vz7ytk
title: Work continued past a submitted task instead of stopping at its boundary
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m14enxw9tbbgv2kbbsxmnmpc
created_at: '2026-08-28'
disposition: amend-spec
resolved_at: '2026-08-29T13:33:12.477Z'
approved_by: cli
approved_at: '2026-08-29T13:33:12.477Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
---
# F-01m14eq1kjmxz28f01k1vz7ytk — Work continued past a submitted task instead of stopping at its boundary

## Observation

Work continued past a submitted task instead of stopping at its boundary.

## Evidence

On 2026-08-27 the operator decided that init should prompt rather than commit (D-01m14ccbcvntfbkwxty56sybak, then D-01m14dvygt52rpywdv818s5pe0). The second half of that work was implemented on top of T-01m14a4q1r5c8qfjrq9q1p6zw2 after that task had already been submitted for review, so the evidence recorded at submission no longer described the change on the branch. Nothing in the tool noticed: review does not freeze a task's worktree, and a task in review accepts further commits on the same branch without a word. The correct move was reopen, which is a human gate and was unavailable with the operator away, so the work was recorded under a task of its own with the sequence stated and the deviation declared. What is missing is any signal at all: a submitted task whose branch moves afterwards is a review describing something that is no longer there, and the reader of that review has no way to know.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
