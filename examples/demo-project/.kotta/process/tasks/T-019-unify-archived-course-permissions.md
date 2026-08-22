---
id: T-019
title: Unify archived-course export permissions
status: backlog
origin: observation
types:
  - bug
  - refactor
profiles:
  - bug
  - refactor
priority: null
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
source_observation: F-032
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-019 — Unify archived-course export permissions

## Outcome

To be defined: archived-course exports use one documented permission policy.

## Scope

Compare the two proven permission paths and propose the smallest safe correction.

## Non-goals

Do not change permissions until the intended archived-course policy is confirmed.

## Acceptance

To be refined from the evidence in `F-032` after the product decision is made.

## Verification

To be defined during ticket refinement.

## Constraints

Preserve current access until a human confirms the intended policy.

## Open decisions

- Should managers who can view archived courses also be allowed to export them?

## Actual behaviour

The list permits some managers to view archived courses while export rejects them.

## Expected behaviour

List and export authorization should implement one human-approved archived-course policy.

## Reproduction steps

Sign in as the affected manager, include archived courses, then compare list and export results.

## Environment

Local test fixture using the current list and export permission helpers.

## Frequency

Reproduces whenever that manager exports a result set containing archived courses.

## Impact

Users can see data that the same workflow refuses to export, with no documented reason.

## Regression-test expectation

Add a shared authorization matrix covering active and archived courses for both paths.

## Current structural problem

List and export paths delegate the same policy question to different helpers.

## Demonstrated cost or risk

The helpers already return conflicting decisions for the same actor and course state.

## Behavioural invariants

Unauthorized users remain denied, and active-course access does not broaden accidentally.

## Target structural property

Both paths derive their answer from one documented policy decision and shared rule.

## Excluded redesign

No role-system rewrite, permission UI, or unrelated authorization cleanup.

## Behaviour-preserving verification

Run the existing permission suite plus the new cross-path matrix, preserving all cases
outside the approved archived-course change.

## Execution notes

Created by human disposition of `F-032`; intentionally remains in backlog and is
not part of `P-012`.
