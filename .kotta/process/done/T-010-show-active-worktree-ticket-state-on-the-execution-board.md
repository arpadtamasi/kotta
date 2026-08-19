---
id: T-010
title: Show active worktree ticket state on the execution board
status: done
origin: human
types:
  - bug
profiles:
  - bug
  - ui
  - workflow
priority: high
risk: medium
batch: P-003
depends_on: []
blocks: []
branch: fix/T-010-show-active-worktree-ticket-state-on-the-execution-board
pull_request: null
created_at: '2026-07-22'
updated_at: '2026-07-23'
assigned_agent: codex
resolution: completed
---
# T-010 — Show active worktree ticket state on the execution board

## Outcome

The execution board shows the effective lifecycle state of every ticket, including ticket state stored in an active ticket worktree, so a claimed and running ticket appears in Active rather than Ready.

## Actual behaviour

After `a-team package start P-002 --agent codex` started T-008, the coordinator worktree retained its Ready copy while the ticket worktree contained the canonical Active copy and claim. The UI read only the coordinator `.a-team` state directories and displayed T-008 in Ready with zero Active tickets.

## Expected behaviour

The board resolves ticket state using the same worktree-aware rule as `a-team package status`: when `.worktrees/<ticket-id>` exists and contains the ticket, that ticket's worktree state and metadata override the coordinator snapshot. T-008 therefore appears exactly once in Active.

## Reproduction steps

1. Put a valid ticket in Ready and a containing package in Ready on a coordinator branch.
2. Run `a-team package start <package-id> --agent codex`.
3. Confirm the ticket becomes Active inside `.worktrees/<ticket-id>` and has a claim while the coordinator snapshot remains Ready.
4. Open or refresh `a-team ui --workspace <repository>`.
5. Observe that the ticket incorrectly appears in Ready; compare with `a-team package status <package-id>`, which reports Active.

## Environment

Local filesystem-backed A-Team UI on macOS, repository using Git worktrees, observed on 2026-07-22 with P-002 and T-008.

## Frequency

Deterministic for tickets started into their own worktree while the UI reads the coordinator workspace.

## Impact

The execution board misrepresents in-flight work, its Active count, and package progress. A PM may start duplicate work or conclude that an agent is idle while a release operation is running.

## Regression-test expectation

Add an integration test whose coordinator snapshot says Ready and whose ticket worktree says Active with a valid claim. `readWorkspace` must return one T-008 record with `status: active`, its active branch and assigned agent, and no duplicate Ready record. Retain coverage for repositories without ticket worktrees and for stale or unreadable worktree directories.

## User goal

Trust the board as the current execution view without knowing Git worktree storage details or running a second status command.

## Entry point

Open the execution board for a repository after starting an individual ticket or package.

## Default state

Each ticket appears once in the column matching its effective lifecycle state.

## Loading state

Keep the current board loading treatment while the workspace snapshot is fetched.

## Empty state

The Active empty state appears only when no effective ticket state is Active.

## Error state

If a referenced worktree is stale, missing, or unreadable, fall back safely to the coordinator snapshot and expose enough diagnostic context for troubleshooting without breaking the board.

## Success state

An active claimed ticket appears in Active within the normal refresh interval and its Ready snapshot is not rendered.

## Disabled state

No new interactive control is required.

## Responsive behaviour

No layout change; corrected state must work at every currently supported board width.

## Keyboard and focus behaviour

No interaction change; existing ticket-card keyboard and focus behavior remains intact when the card changes columns.

## Accessibility expectations

Column heading counts and ticket status text must reflect the effective state exposed visually.

## Visual reference

Observed failure: P-002 selected, T-008 rendered under Ready while its npm publish worktree and claim were active; Active showed zero.

## Actors

Coordinator, ticket worker, filesystem-backed UI server, and PM viewing the board.

## Initial state

The coordinator has a Ready ticket snapshot; `ticket start` creates a ticket worktree where the ticket is Active and writes its claim.

## States

Coordinator snapshot, effective worktree state, active claim, stale worktree fallback, and rendered board state.

## Transitions

Starting a ticket makes its worktree Active; the next UI refresh resolves that worktree as authoritative for display. Review and Done transitions must likewise replace, not duplicate, the coordinator snapshot when present.

## Triggers

Workspace API reads and the existing 1.5-second UI refresh.

## Permissions

Resolution is read-only. The UI must not move files, create claims, or mutate worktrees while building its workspace response.

## Error paths

Missing worktree, missing ticket within a worktree, malformed ticket metadata, and a worktree removed between discovery and read must not crash the whole workspace endpoint. Use the coordinator snapshot as fallback and keep deterministic ticket de-duplication.

## Cancellation path

Stopping or releasing work removes or changes the effective worktree state through existing lifecycle commands; the subsequent refresh returns to the surviving canonical state.

## Retry and duplicate-action behaviour

Repeated reads are idempotent and return one record per ticket ID. Refreshing during a transition may show either complete snapshot but never duplicates.

## Audit and notification expectations

No new persistent audit record or notification. Existing claim and branch metadata remain visible in the returned ticket record for inspection.

## Scope

- Make `readWorkspace` resolve ticket worktree state before returning tickets.
- Share or reuse the effective-state logic already used by `package status` rather than maintaining divergent semantics.
- Deduplicate coordinator and worktree copies by ticket ID.
- Add regression coverage for active, absent, and stale worktrees.
- Verify the board count and column placement against the corrected workspace response.

## Non-goals

- Changing ticket lifecycle semantics.
- Moving coordinator ticket files when a ticket starts.
- Adding Start, Claim, Review, or Close controls to the UI.
- Altering package dependency scheduling or npm release behavior.

## Acceptance

- With T-008 Ready in the coordinator snapshot and Active in `.worktrees/T-008`, `/api/workspace` returns T-008 exactly once with `status: active`.
- The board renders T-008 in Active, shows the corrected Active and Ready counts, and updates within the existing refresh interval.
- The effective record retains the ticket worktree's branch and assigned-agent metadata.
- `a-team package status P-002` and the board agree that T-008 is Active.
- A missing, stale, or unreadable ticket worktree does not break `/api/workspace` and falls back to the coordinator ticket without duplication.
- Repositories with no `.worktrees` directory retain current behavior.

## Verification

- Add focused integration tests for `readWorkspace` covering Active override, exact-ID de-duplication, no-worktree fallback, and stale-worktree fallback.
- Run the UI/data integration suite and full test suite.
- Start a fixture ticket through the canonical CLI, query `/api/workspace`, and verify its effective state against `package status`.
- Open the board and capture evidence that the active ticket and counts appear in the correct column.

## Constraints

Keep the filesystem canonical and workspace reads read-only. Avoid scanning arbitrary paths: only inspect validated ticket worktrees beneath the repository's `.worktrees` directory. Preserve the current API shape unless an additive field is necessary.

## Open decisions

None.

## Execution notes

Root cause confirmed on 2026-07-22: `src/commands/ui.ts#readWorkspace` reads only coordinator state directories, while `src/commands/package.ts#packageStatus` already checks `.worktrees/<ticket-id>` first. The fix should unify these projections.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| With T-008 Ready in the coordinator snapshot and Active in `.worktrees/T-008`, `/api/workspace` returns T-008 exactly once with `status: active`. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| The board renders T-008 in Active, shows the corrected Active and Ready counts, and updates within the existing refresh interval. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| The effective record retains the ticket worktree's branch and assigned-agent metadata. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| `a-team package status P-002` and the board agree that T-008 is Active. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| A missing, stale, or unreadable ticket worktree does not break `/api/workspace` and falls back to the coordinator ticket without duplication. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| Repositories with no `.worktrees` directory retain current behavior. | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| bug: expected_behavior_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| bug: regression_test_added_or_exception_recorded | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| bug: affected_environment_rechecked | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| ui: required_states_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| ui: accessibility_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| ui: visual_evidence_present | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| workflow: happy_path_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| workflow: failure_and_cancellation_paths_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |
| workflow: authorization_and_idempotency_verified | Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed. |

### Verification performed

Verification passed: npm test built CLI, UI, and site, then ran 11 test files with 22 passed and 1 skipped; focused UI/data and package integration run passed 7 tests with 1 skipped; npm run typecheck passed; ticket validate T-010 passed. Canonical package-start fixture proves package status and readWorkspace both resolve the same active worktree ticket once, retaining branch and assigned_agent. Active, no-worktree, stale-worktree, and malformed-worktree regressions pass with safe fallback and diagnostics. Live P-003 package status reported T-010 active; /api/workspace returned exactly one active T-010 with branch fix/T-010-show-active-worktree-ticket-state-on-the-execution-board and assigned_agent codex. Browser QA at desktop, tablet, and mobile widths showed T-010 in Active, Active count 2, Ready count 4, accessible column counts, and no console errors; screenshot captured at /private/tmp/T-010-execution-board.png. Read behavior is idempotent and read-only; no lifecycle, interaction, keyboard, or focus behavior changed.

### Deviations

None.

### Findings created

None.

### Known concerns

None.
