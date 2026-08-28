---
id: F-01m14h1kd901k9mq2kfbqdj4t7
title: >-
  The task an observation was discovered during can only be recorded when it is
  created
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: T-01m14enxw9tbbgv2kbbsxmnmpc
created_at: '2026-08-28'
---
# F-01m14h1kd901k9mq2kfbqdj4t7 — The task an observation was discovered during can only be recorded when it is created

## Observation

The task an observation was discovered during can only be recorded when it is created.

## Evidence

discovered_during is written once, by observation new --discovered-during, and no command can set it afterwards: src/commands/observation.ts exposes new, validate and resolve, and only new accepts the flag. Since 2026-08-27 the sweep clears a task's deviation when an observation names it, so an observation written without the flag leaves the deviation reported forever - the finding is recorded, the link is not, and nothing can join them. Measured now: nineteen tasks are reported, and at least one of them - T-01m14enxw9tbbgv2kbbsxmnmpc, closed today - already has the observation that answers it (F-01m14fbdrst4pcr47ck1vz7ytk), written minutes earlier without the flag. The only ways to clear it are to write a second observation saying the same thing, or to hand-edit a Kotta-owned file. The specification says a declared deviation names what it left behind; it does not say the naming may only happen in the same breath as the noticing.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
