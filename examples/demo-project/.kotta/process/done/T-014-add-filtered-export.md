---
id: T-014
title: Add filtered course export
status: done
origin: human
types:
  - feature
  - ui
  - workflow
profiles:
  - ui
  - workflow
priority: high
risk: medium
batch: P-012
depends_on: []
blocks:
  - T-018
branch: null
pull_request: 'https://example.invalid/pull/14'
resolution: completed
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-014 — Add filtered course export

## Outcome

Course managers can export only the courses visible under their current filters.

## Scope

Add an export action to the course list, preserve active filters in the export
request, and show progress, success, and failure feedback.

## Non-goals

Do not redesign permissions, add export formats, or change the background job
system.

## Acceptance

- The export request contains the active search, status, and owner filters.
- The action has loading, success, empty, error, and disabled states.
- Keyboard users can trigger the action and retain a predictable focus position.
- Only course managers can start an export.

## Verification

- UI tests cover filter serialization and every visible state.
- A workflow test covers allowed and denied export requests.
- Review evidence records the test run and screenshots at desktop and mobile widths.

## Constraints

Use the existing CSV export endpoint and design system controls.

## Open decisions

None.

## User goal

Download the currently filtered course list.

## Entry point

The `Export CSV` action in the course-list toolbar.

## Default state

The enabled action includes the number of matching results.

## Loading state

The action is disabled and labelled `Preparing…` while submitting.

## Empty state

The action is disabled when no course matches the current filters.

## Error state

An inline retry message appears and the current filters remain unchanged.

## Success state

The download starts and a confirmation is announced.

## Disabled state

The action is disabled while submitting and when no exportable result exists.

## Responsive behaviour

The action moves into the toolbar overflow below 640 px.

## Keyboard and focus behaviour

The action is reachable by Tab; after an error, focus returns to it.

## Accessibility expectations

The control has an accessible name and state changes use a polite live region.

## Visual reference

The existing course-list toolbar and design-system controls are the reference.

## Actors

Course manager, unauthorized user, and export worker.

## Initial state

A signed-in user is viewing a filtered course list.

## States

Idle, submitting, queued, completed, and failed.

## Transitions

Submission queues work; worker completion starts the download; failure enables retry.

## Triggers

A course manager selects `Export CSV`.

## Permissions

The server verifies course-manager access before queuing work.

## Error paths

Denied and failed requests show actionable messages without losing filters.

## Cancellation path

The user can abandon submission before acceptance; queued work cannot be cancelled.

## Retry and duplicate-action behaviour

Retry is explicit, and the disabled loading state prevents duplicate clicks.

## Audit and notification expectations

The existing export audit event is emitted once; UI status is announced locally.

## Review evidence

UI and workflow tests passed. Reviewers accepted desktop and mobile screenshots
and the successful and denied-request traces in pull request 14.

## Execution notes

- Moved `backlog → ready` after the UI and workflow sections were completed.
- Claimed as `agent-demo` on branch `kotta/T-014-add-filtered-export` in
  `.worktrees/T-014`; no implementation happened on `main`.
- During execution, permission checks for archived courses were left unchanged
  and captured as `F-032`.
- Review evidence: UI and workflow tests passed; desktop and mobile screenshots
  were accepted in pull request 14.
- The pull request was merged and the claim, feature branch, and worktree were
  released before this ticket moved to `done`.
