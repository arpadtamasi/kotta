---
id: T-015
title: Add export job status endpoint
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
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-015 — Add export job status endpoint

## Outcome

Clients can read the state of an export job until it completes or fails.

## Scope

Expose queued, running, completed, and failed states through the existing API.

## Non-goals

Do not add cancellation or job-history screens.

## Acceptance

- Authorized owners can read job status.
- Unknown, forbidden, completed, and failed jobs have explicit responses.
- Repeated reads do not mutate job state.

## Verification

Run API contract tests for every state and permission outcome.

## Constraints

Keep the existing authentication and error envelope.

## Open decisions

None.

## Actors

Job owner and unauthorized user.

## Initial state

An export job exists after an accepted export request.

## States

Queued, running, completed, and failed.

## Transitions

The endpoint observes state changes made by the worker but never changes them.

## Triggers

An authenticated client requests a job's status.

## Permissions

Only the job owner may read its status.

## Error paths

Unknown and unauthorized jobs return explicit not-found and forbidden responses.

## Cancellation path

Cancellation is outside this endpoint and leaves status reads unaffected.

## Retry and duplicate-action behaviour

Repeated and concurrent reads are idempotent.

## Audit and notification expectations

Status reads emit no event or notification.

## Execution notes

Ready for an isolated claim, branch, and worktree.
