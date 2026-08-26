---
id: F-01m0ytmp2fpw8kzn5n17sdgc5a
title: 29 closed tasks declared a deviation that no observation records
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
---
# F-01m0ytmp2fpw8kzn5n17sdgc5a — 29 closed tasks declared a deviation that no observation records

## Observation

29 closed tasks declared a deviation that no observation records.

## Evidence

The first honest run of kotta sweep on this workspace, 2026-08-26, put 29 tasks in undeclared-deviation: closed with a non-empty '### Deviations' section and 'Not declared.' under '### Observations created'. Checked by hand on two of them and both are true positives - T-01m0xp4sph61ykf0y0dbcbt4dx declared that its first submission carried a false prose measurement, T-01m0v2d804h1pk95y4bmq7fk8m declared a change beyond its stated Scope; neither left an observation behind. The oldest are T-012 through T-036 at 24 days, the newest closed today, so this is not a legacy habit that stopped: three of the 29 were closed in this session. BR-01m0fp2hdkqz08arp5ebt122r9 says a task never widens itself and raises an observation instead; declaring the widening in the review satisfies the reviewer and leaves nothing in the queue, so the noticing dies with the task that made it. The remedy is not obvious - requiring an observation per deviation would make the review gate heavier, and most of the 29 declared something that needed no follow-up - which is why this is recorded rather than fixed.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
