---
id: T-018
title: Verify filtered export audit event
status: defined
origin: human
types:
  - feature
  - workflow
profiles:
  - workflow
priority: medium
risk: low
batch: P-012
depends_on:
  - T-014
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-018 — Verify filtered export audit event

## Outcome

Every accepted filtered export records one audit event with its filter summary.

## Scope

Extend the existing export event and verify its delivery.

## Non-goals

Do not introduce a new analytics pipeline or reporting UI.

## Acceptance

- One event is emitted for each accepted export.
- Denied and duplicate requests emit no event.
- The event contains filter names but no course-row data.

## Verification

Run workflow tests for accepted, denied, retried, and duplicate requests.

## Constraints

Do not add personal data to the event payload.

## Open decisions

None.

## Actors

Course manager, export API, and audit sink.

## Initial state

`T-014` is complete and a filtered export is requested.

## States

Requested, accepted or denied, and event delivered.

## Transitions

Only an accepted request advances to event delivery.

## Triggers

Successful authorization of a filtered export.

## Permissions

Event emission reuses the server's accepted authorization result.

## Error paths

Audit delivery failures follow the existing bounded retry policy.

## Cancellation path

A request cancelled before acceptance emits nothing; accepted work is not cancelled.

## Retry and duplicate-action behaviour

The export idempotency key prevents duplicate events across retries.

## Audit and notification expectations

One audit event records filter names, and its delivery is visible in test evidence.

## Execution notes

Dependency `T-014` is complete; this ticket is ready to start.
