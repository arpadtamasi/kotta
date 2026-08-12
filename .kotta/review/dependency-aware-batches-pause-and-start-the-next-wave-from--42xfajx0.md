---
id: T-01kzw15bre7s0wms8d42xfajx0
title: Dependency-aware batches pause and start the next wave from main
status: review
origin: observation
types:
  - bug
profiles:
  - bug
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  fix/T-01kzw15bre7s0wms8d42xfajx0-dependency-aware-batches-pause-and-start-the-next-wave-from-
pull_request: null
created_at: '2026-08-12'
updated_at: '2026-08-12'
source_observation: F-01kzw13qka26pq2jgjja1t562m
assigned_agent: codex
worktree: .worktrees/T-01kzw15bre7s0wms8d42xfajx0
execution_mode: fresh
branch_origin: created
---
# T-01kzw15bre7s0wms8d42xfajx0 — Dependency-aware batches pause and start the next wave from main

## Outcome

A dependency-aware batch advances from a reviewed, coordinator-integrated predecessor to its next wave without an intermediate human close, and every newly started member is based on the current batch coordinator head.

## Actual behaviour

`batch start` and `contract start` treat only `done` dependencies as executable. Closing a reviewed predecessor therefore becomes a scheduler gate. After that close, `startContract` creates the dependent worktree from the control checkout's `HEAD`, which is normally `main`, even though the predecessor's implementation exists only on the batch coordinator branch.

## Expected behaviour

Inside an active batch, a dependency is execution-ready when it is already `done`, or when it is in `review` and Git proves its feature branch is an ancestor of the batch coordinator branch. A newly started batch member branches from the current coordinator head. Human acceptance remains required for `review → done` and is not required merely to dispatch the next technical wave.

## Reproduction steps

1. Create two defined contracts A and B, with B depending on A, and add them to one dependency-aware batch.
2. Start the batch, implement A, submit A for review, and merge A's feature branch into the recorded coordinator branch without closing A.
3. Start the batch again and observe that B remains waiting because A is not `done`.
4. Close A, start the batch again, and observe that B's worktree starts at `main` rather than the coordinator head and lacks A's implementation.

## Environment

Kotta 0.5.0 in a Git repository with a protected `main` control checkout, a linked batch coordinator worktree, and linked contract worktrees. Public report: https://github.com/arpadtamasi/kotta/issues/36.

## Frequency

Every dependency wave whose predecessor is integrated into the coordinator but not yet human-closed; the wrong start point occurs whenever the coordinator has commits not present on the control checkout `HEAD`.

## Impact

Unattended batch execution pauses at every dependency wave. Continuing after approval creates a dependent worktree without its prerequisite code, forcing an unrecorded manual merge and risking implementation or verification against the wrong baseline.

## Regression-test expectation

An integration test drives a two-contract dependency batch through predecessor review and coordinator integration without close, proves the next `batch start` dispatches the dependent contract, and proves the dependent worktree head equals the coordinator head and contains the predecessor's committed file. Negative coverage proves review without coordinator ancestry does not unlock execution and ordinary non-batch dependency rules remain unchanged.

## Actors

- The human defines and accepts contract intent and later accepts review evidence.
- The batch coordinator sequences waves, verifies coordinator ancestry, and dispatches eligible contracts.
- A fresh contract agent implements one claimed contract in the worktree Kotta creates.

## Initial state

The batch is active and records a live coordinator branch. A predecessor contract is in `review` with its implementation branch merged into that coordinator. A dependent member is valid and `defined` with no claim.

## States

The existing `defined → active → review → done` contract lifecycle and `defined → active → done` batch lifecycle remain unchanged. Execution readiness becomes a batch-context predicate distinct from human acceptance: `done`, or `review` plus proven coordinator ancestry.

## Transitions

- Predecessor `active → review`, followed by integration into the coordinator, makes a same-batch dependent dispatchable without moving the predecessor to `done`.
- Dependent `defined → active` creates its branch and worktree from the coordinator's current commit.
- Predecessor `review → done` remains a separate human-approved acceptance transition and performs the existing cleanup.

## Triggers

`kotta batch start <batch> --agent <agent>` computes the current eligible frontier. It supplies the recorded coordinator branch as both the dependency-integration target and the start ref for each newly dispatched contract.

## Permissions

The coordinator may dispatch only validated, defined contracts whose dependencies satisfy the batch predicate. This authority does not include approving review, closing a contract, changing scope, resolving deviations, or bypassing a missing Git ancestry proof.

## Error paths

A missing coordinator branch, missing dependency branch, dependency outside `review`/`done`, or failed ancestry check leaves the dependent contract waiting and creates no claim, branch, or worktree. Git refusal during worktree creation retains the existing rollback guarantees.

## Cancellation path

Existing human-approved contract cancellation remains unchanged. Cancelling or closing a predecessor continues to use the existing terminal dependency semantics; this contract adds no cascade or automatic cancellation.

## Retry and duplicate-action behaviour

Repeating `batch start` recomputes readiness from canonical lifecycle state and Git ancestry. Already claimed or active contracts are not started twice, and a refused dependency creates no partial execution context. A later retry succeeds once review and coordinator ancestry are both true.

## Audit and notification expectations

The contract-start result and lifecycle event identify the start ref and exact start commit so the coordinator baseline is inspectable. Waiting output continues to name contracts that were not dispatched; no automatic human approval receipt is fabricated.

## Scope

- Add a batch-context dependency-satisfaction check backed by lifecycle state and Git ancestry.
- Allow `startContract` to receive an explicit, validated start ref and dependency integration target from `batch start`.
- Create batch member worktrees from the current coordinator commit and expose that baseline in command output and lifecycle history.
- Add positive and negative integration coverage for chained batch waves.
- Update the batch execution skill, generated agent rules, and README to describe technical wave handoff separately from human close.

## Non-goals

- Automatically closing contracts or batches.
- Removing, weakening, or pre-authorizing the human `review → done` gate.
- Adding a lifecycle state or changing standalone contract dependency semantics.
- Automatically merging feature branches into the coordinator.
- Redesigning batch parallelism, failure policy, nesting, or coordinator finalization.

## Acceptance

- A reviewed predecessor whose branch is an ancestor of the recorded coordinator satisfies a same-batch dependency without being closed.
- A reviewed predecessor not integrated into the coordinator does not satisfy the dependency and no execution context is created for its dependent.
- The dependent worktree starts at the exact coordinator head visible at dispatch and contains all coordinator-integrated predecessor changes.
- A dependency that is neither `done` nor reviewed-and-integrated remains unresolved; standalone contract starts continue to require `done` dependencies.
- Human approval is still required for every `review → done` transition, and a batch with reviewed members does not report itself `done`.
- Start output and lifecycle history expose the symbolic start ref and resolved commit.
- Regression tests, the full test suite, type checking, build, and workspace validation pass.

## Verification

- Run the focused integration tests covering batch dependency waves, coordinator branches, and ordinary contract starts.
- Run `npm test`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `kotta validate`.

## Constraints

Use Git ancestry as the integration proof; do not infer readiness from names, messages, timestamps, or lifecycle state alone. Preserve atomic start rollback and the control-plane ownership model. Keep human acceptance semantically and mechanically separate from technical dependency readiness.

## Open decisions

None.

## Execution notes

The implementation seam is `startBatch` in `src/commands/batch.ts` and `startContract` in `src/commands/contract.ts`. Decisions D-002 and D-004 already make verification and actually merged prerequisites the load-bearing pre-flight checks; this contract applies those decisions without changing the two human gates.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A reviewed predecessor whose branch is an ancestor of the recorded coordinator satisfies a same-batch dependency without being closed. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| A reviewed predecessor not integrated into the coordinator does not satisfy the dependency and no execution context is created for its dependent. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| The dependent worktree starts at the exact coordinator head visible at dispatch and contains all coordinator-integrated predecessor changes. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| A dependency that is neither `done` nor reviewed-and-integrated remains unresolved; standalone contract starts continue to require `done` dependencies. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| Human approval is still required for every `review → done` transition, and a batch with reviewed members does not report itself `done`. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| Start output and lifecycle history expose the symbolic start ref and resolved commit. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| Regression tests, the full test suite, type checking, build, and workspace validation pass. | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| bug: expected_behavior_verified | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| bug: regression_test_added_or_exception_recorded | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| bug: affected_environment_rechecked | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| workflow: happy_path_verified | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| workflow: failure_and_cancellation_paths_verified | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |
| workflow: authorization_and_idempotency_verified | Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed. |

### Verification performed

Commit ce1d02f implements dependency-aware technical handoff and coordinator baselines. Regression test fails on pristine HEAD and passes after the change. Final verification: npm test — 45 files passed, 299 tests passed, 1 skipped; npm run typecheck passed; npm run build passed; focused batch dependency wave tests 4/4 passed; the affected isolated workspace kotta validate passed; git diff --check passed.

### Deviations

None.

### Observations created

None.

### Known concerns

The shared repository kotta validate is red only because pre-existing completed contract T-01kzgn32keps18769dp5rstcgt declares no deviations while its historical verification narrative contains DEVIATIONS. The changed behavior and new claim metadata validate cleanly in the isolated integration workspace.
