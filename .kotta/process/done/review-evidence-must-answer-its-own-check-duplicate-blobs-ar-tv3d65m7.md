---
id: T-01m0fq318dpmktbc2jtv3d65m7
title: 'Review evidence must answer its own check: duplicate blobs are refused'
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on: []
blocks: []
spec:
  - BR-01m0fp2hdkj0ba2vzsyq0jtdce
  - EX-01m0fp2hdk68mttdbh50m98s4f
branch: >-
  feat/T-01m0fq318dpmktbc2jtv3d65m7-review-evidence-must-answer-its-own-check-duplicate-blobs-ar
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
assigned_agent: codex
worktree: .worktrees/T-01m0fq318dpmktbc2jtv3d65m7
execution_mode: fresh
branch_origin: created
start_ref: coord/P-01m0fq77101axprvcjwrq3bs61
start_commit: f9efa3912433498c4a8f01cb6750cf73bdf81f7e
dependency_integration_target: coord/P-01m0fq77101axprvcjwrq3bs61
resolution: completed
approved_by: cli
approved_at: '2026-08-20T21:02:52.467Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

Review submission enforces evidence fitness: identical text filed under two named checks of the same task is a validation failure, refused with the two check names. The F-018 pattern - one ~1000-word blob pasted into seven evidence rows, one of which literally declared its check unperformed, in tasks that passed - becomes impossible to submit.

## Scope

The review submission validation (CLI and MCP), comparing evidence entries pairwise per task; the refusal message names the colliding checks and the rule.

## Non-goals

No semantic judgement of whether prose truly answers a check - this task ships the string-level gate the observation itself proposed as the cheapest first slice. No re-validation of past reviews.

## Acceptance

- Submitting a review with byte-identical evidence in two checks is refused, naming both checks.
- Distinct evidence per check submits exactly as before.
- The refusal names the violated rule as the spec states it.

## Verification

- Unit tests for the pairwise comparison, including whitespace-normalised duplicates.
- An integration test reproducing the F-018 shape and asserting refusal.

## Constraints

Comparison is per task, not across tasks.

## Open decisions

None.

## Execution notes

Spec side: "Evidence answers its own check", "Duplicated evidence is refused".

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Submitting a review with byte-identical evidence in two checks is refused, naming both checks. | tests/unit/review-evidence.test.ts and tests/integration/review-evidence.test.ts reproduce whitespace-normalized duplication and assert both check names in the refusal. |
| Distinct evidence per check submits exactly as before. | CLI integration and MCP integration submit distinct exact-check mappings and verify separate evidence rows plus review state. |
| The refusal names the violated rule as the spec states it. | Unit and CLI integration assertions require the exact rule phrase Evidence answers its own check. |

### Verification performed

Submitting a review with byte-identical evidence in two checks is refused, naming both checks.: tests/unit/review-evidence.test.ts and tests/integration/review-evidence.test.ts reproduce whitespace-normalized duplication and assert both check names in the refusal.
Distinct evidence per check submits exactly as before.: CLI integration and MCP integration submit distinct exact-check mappings and verify separate evidence rows plus review state.
The refusal names the violated rule as the spec states it.: Unit and CLI integration assertions require the exact rule phrase Evidence answers its own check.

### Deviations

None.

### Observations created

F-01m0g6hsgby0yb89zrrgyj9wyh

### Known concerns

None.
