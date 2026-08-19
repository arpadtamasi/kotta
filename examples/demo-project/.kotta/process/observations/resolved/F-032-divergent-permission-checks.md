---
id: F-032
title: Permission checks diverge for archived courses
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-014
disposition: create_ticket
result: T-019
created_at: '2026-07-21'
resolved_at: '2026-07-21'
---
# F-032 — Permission checks diverge for archived courses

## Observation

The course list allows a manager to view archived courses, while the export
authorization path rejects the same manager when archived rows are included.

## Evidence

- A focused permission test reproduced the differing decisions for one actor.
- The list and export paths call different policy helpers.
- No existing finding or ticket covered this mismatch.

## Impact hypothesis

Managers may see archived courses they cannot export, but the intended policy is
not documented. Changing it inside `T-014` would expand that ticket's scope.

## Confidence

High confidence in the divergent behaviour; uncertain which policy is intended.

## Suggested disposition

Create a backlog ticket for a human policy decision and a bounded correction.

## Resolution

A human accepted the finding and created `T-019`. No permission behaviour was
changed as part of `T-014`.
