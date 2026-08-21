---
id: F-01m0jdv8gmn91txnn6jtfb9f5b
title: resolve moves the observation even when its lifecycle event fails to write
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-21'
---
# F-01m0jdv8gmn91txnn6jtfb9f5b — resolve moves the observation even when its lifecycle event fails to write

## Observation

resolve moves the observation even when its lifecycle event fails to write.

## Evidence

Resolving F-dm37tkv3 and F-9mg56yk6 on 2026-08-21 threw 'Invalid Kotta event: event task must be null or a valid task id' — their legacy discovered_during fields carry an F- observation id, which the event writer rejects — yet both files still moved to resolved, so the state change landed without its event. Two defects in one: the event schema refuses legacy discovered_during values, and the resolve mutation is not atomic with its event.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
