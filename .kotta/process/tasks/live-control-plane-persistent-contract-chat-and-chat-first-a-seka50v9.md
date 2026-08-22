---
id: T-01kz8tk2t53jbax6mrseka50v9
title: 'Live control plane, persistent contract chat and chat-first approvals'
status: done
origin: human
types:
  - workflow
profiles:
  - workflow
  - ui
priority: high
risk: high
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01kz8tk2t53jbax6mrseka50v9-live-control-plane-persistent-contract-chat-and-chat-first-a
pull_request: 'https://github.com/arpadtamasi/kotta/pull/26'
created_at: '2026-08-05'
updated_at: '2026-08-07'
assigned_agent: codex
resolution: completed
---
# Live control plane, persistent contract chat and chat-first approvals

## Outcome

Kotta keeps live operational state and the user-visible contract conversation on the configured base branch, `main` by default, while implementation code remains isolated in one feature branch and worktree per contract. The board therefore shows current claims, lifecycle state, chat and approvals while work is in progress. A caller may execute inside the contract worktree with inherited context, while `contract execute` remains the default bounded-context path that launches a fresh executor from the deterministic brief.

Human approvals happen primarily inside the contract chat. The user sees the exact pending transition, approves or rejects it there, and Kotta records a durable, scoped approval event before applying the transition. The CLI remains a supported fallback, not the required user interface.

## Actors

- Human operator: supplies intent, approves or rejects a specific pending action, and reviews evidence.
- Caller/orchestrator agent: starts or coordinates a contract and may either continue inline or launch a fresh executor.
- Fresh executor agent: receives the deterministic brief and works only in the contract worktree.
- Kotta control plane: owns canonical contracts, claims, observations, chat events, approvals and lifecycle transitions on the configured base branch.
- Contract worktree: owns implementation changes on the contract feature branch and does not carry a competing lifecycle state.
- Board server and UI: read the live control plane, stream agent responses and submit chat actions through Kotta's validated mutation services.

## Initial state

- The repository has one configured `git.base_branch`, normally `main`, checked out in a discoverable control worktree.
- A contract is in backlog or defined on that branch.
- No claim, feature branch, worktree or chat thread is required before the first action.
- Existing workspaces without chat records remain valid and render an empty conversation.

## States

- The contract lifecycle remains `backlog → defined → active → review → done`.
- Execution mode is either `fresh` or `inherited`; it does not change lifecycle semantics.
- A chat action is `proposed`, then exactly one of `approved`, `rejected` or `cancelled`, then optionally `applied` or `failed`.
- Chat messages are immutable user-visible events with human or assistant role. Internal reasoning, streaming deltas and raw tool output are not durable chat events.
- The control plane is `available`, `locked` or `unavailable`; no lifecycle mutation falls back to a feature branch.

## Transitions

1. Defining and signing remain control-plane transitions. A chat approval can sign a valid backlog contract.
2. Starting a defined contract creates one claim, feature branch and linked worktree, then records `active` on the control plane. The operation is transactional or rolls back to the prior consistent state.
3. The caller chooses execution mode after start: continue in the returned worktree with inherited context, or use `contract execute` for a fresh brief-only executor. Fresh remains the documented default.
4. User and final assistant messages append to the contract conversation on the control plane. A completed response remains after board restart.
5. A pending approval names the exact command-equivalent action, entity and expected transition. Approval applies only to that action once.
6. Review submission records evidence and `review` on the control plane while the implementation commit and pull request remain on the feature branch.
7. After integration, close records `done` on the control plane and safely releases the claim, worktree and merged branch.

## Triggers

- CLI commands invoked from the base checkout or any linked contract worktree.
- User messages and approval actions in the board's contract chat.
- Agent completion, failure, cancellation and retry events.
- Pull-request merge and the existing close workflow.

## Permissions

- Only an explicit human action in the current contract chat may approve a proposed transition. Ordinary discussion, `ok` without a pending action, agent text and tool output never count as approval.
- An approval receipt is scoped to one action and entity, references the durable human chat event, and is consumed at most once.
- Agents may prepare and present actions. They may apply an action after its receipt exists; they may not mint a human approval event themselves.
- The existing CLI `--approve` path remains available for a human-operated terminal and backward compatibility. It records the same audit shape where the caller supplies no chat receipt.
- Board endpoints call the same validated domain mutation functions as the CLI. They do not hand-edit `.kotta/` files or implement parallel transition rules.

## Error paths

- Missing, dirty, locked or ambiguous control worktree: reject before mutation and name the corrective action. Never write lifecycle state into the feature worktree as a fallback.
- Concurrent control-plane writes: serialize with a repository-wide mutation lock; a timed-out caller receives a retryable error.
- Branch/worktree creation succeeds but control-plane activation fails: remove only resources proven to have been created by this attempt and restore the defined state.
- Chat persistence fails: do not claim that the message or approval was saved; show a retryable error and never apply an unrecorded approval.
- Agent streaming fails: preserve the human message and store a visible failed-turn event without inventing an assistant response.
- Approval application fails validation: preserve the receipt and failure reason but do not consume it as successfully applied.
- Main/base advances while a feature worktree runs: control-plane reads use the latest base state; implementation remains on its existing branch until ordinary merge/rebase handling.

## Cancellation path

- A proposed approval can be cancelled or rejected without changing contract state.
- An interrupted executor keeps the claim and worktree for inspection and retry, matching current behaviour.
- Contract cancellation remains human-approved and runs on the control plane; it must not delete a dirty implementation worktree.
- Closing the board server does not delete chat or active execution state.

## Retry and duplicate-action behaviour

- Reposting a message with the same client event id is idempotent and creates one durable event.
- Reusing an approval receipt returns the original applied result or a deterministic already-consumed error; it never applies twice.
- Repeating start never creates a second claim, branch or worktree.
- Retrying a failed chat turn appends a new attempt linked to the failed turn rather than rewriting history.
- Reopening the board reconstructs each contract timeline from canonical events and can resume the stored provider thread when supported; loss of a provider thread id does not lose the visible transcript.

## Audit and notification expectations

- Each durable event records an id, contract id, kind, role or action, timestamp and relevant execution/approval metadata.
- Approval events record proposed action, human decision, source message id, application outcome and failure reason if any.
- The board timeline interleaves chat, lifecycle, execution and approval events in stable order.
- CLI and JSON output identify created entities and the control-plane location they changed.
- No secrets, hidden reasoning or raw subprocess output are persisted. User-visible assistant responses are persisted exactly as shown.

## User goal

Run Kotta from chat without repeatedly copying identifiers into terminal commands, while always seeing the true live state of contracts executing in worktrees.

## Entry point

Open `kotta ui`, select a contract, and use its existing chat drawer. Pending lifecycle actions appear inline in that conversation with approve and reject controls.

## Default state

The drawer shows the persisted timeline, current contract state, execution mode and any single pending action. The composer remains available for ordinary discussion.

## Loading state

While loading history, show a bounded timeline skeleton. While the agent streams, show the transient response separately; persist and insert it only when the final visible message completes.

## Empty state

A contract with no chat events shows a short invitation to ask about or execute that contract. It does not show a terminal command as the primary call to action.

## Error state

Persistence, agent and transition failures appear inline beside the affected turn or action with a retry control and the specific reason. Existing history remains usable.

## Success state

After approval, the action card shows who approved, what transition occurred and its resulting state. After restart, the same messages and outcome are visible.

## Disabled state

Approve and reject controls disable after the first submission, while another control-plane mutation holds the lock, or when the underlying entity no longer matches the proposed transition.

## Responsive behaviour

The existing desktop drawer and narrow viewport remain usable. Timeline content wraps without horizontal scrolling; action controls stay reachable on narrow screens.

## Keyboard and focus behaviour

The composer submits with the existing keyboard convention. Approval controls are keyboard reachable; confirmation moves focus to the resulting event, errors move focus to the retryable error, and streaming does not steal focus from the composer.

## Accessibility expectations

Timeline roles and action states have programmatic labels. Pending, applied, rejected and failed states are distinguishable without colour. Streaming and transition results use non-disruptive live-region announcements.

## Visual reference

Extend the current Kotta Console v2 contract drawer and Modernist tokens in `ui/src/App.tsx` and `ui/src/styles.css`; this is an interaction and information-architecture extension, not a visual redesign.

## Scope

1. Add a control-worktree resolver used by every contract execution lifecycle mutation, claim lookup, execution context lookup, observation created during execution, chat event and approval event. The configured base branch is the state branch; `main` remains the default.
2. Add a repository-wide, crash-safe mutation lock and transactional ordering for cross-worktree state changes.
3. Change start/review/close and execution context handling so the canonical active contract and claim live on the control plane, while feature worktrees contain implementation changes without a competing lifecycle copy.
4. Keep fresh brief-only execution as the default `contract execute` behaviour. Make caller execution a documented, first-class result of `contract start`: the output returns the worktree, branch and brief command and permits the caller to continue there without launching another agent.
5. Persist user-visible contract chat, failed-turn markers, lifecycle events and scoped approval events as validated plain files under `.kotta/` on the control plane. Add schemas/readers/writers and deterministic ordering.
6. Restore persisted chat in the board, stream transient deltas without persisting them, and render proposed approvals as inline chat actions.
7. Support chat-first sign, observation disposition, review acceptance/changes request, contract close and batch close through existing mutation services. Preserve CLI paths for automation and compatibility.
8. Update the board workspace API, CLI human/JSON output, bundled UI, schemas, templates, skills, AGENTS guidance, README and changelog to describe one control plane and two execution modes.
9. Add unit, integration and UI coverage for concurrency, rollback, idempotency, restart persistence, accessibility and both execution modes.
10. Release the completed change through a reviewed PR. Merge to `main` to trigger GitHub Pages, bump the npm package as a backward-compatible minor release, tag the exact release commit and verify the npm and live Pages artifacts.

## Non-goals

- Removing fresh executor isolation or automatically feeding the full chat transcript into a fresh executor.
- Persisting hidden reasoning, arbitrary tool logs, terminal output or provider-internal events.
- A hosted database, remote Kotta service or cross-repository chat synchronization.
- Broad, session-wide or permanent approvals. Every chat approval remains action- and entity-scoped.
- Replacing Git branches/worktrees with another isolation mechanism.
- A visual redesign of the board.
- Automatically rebasing active feature branches whenever control-plane state advances.

## Acceptance

- Starting a contract from `main` or a linked worktree yields exactly one claim, feature branch and worktree; the canonical contract becomes active on the configured base branch and the board shows it without merging the feature branch.
- Review, discovered observations and close invoked from a contract worktree update the control plane and are immediately visible to the board.
- Feature branches do not acquire divergent active/review/done copies of canonical contract state, and merging implementation code does not create duplicate lifecycle files.
- Concurrent mutations are serialized; injected failures at each start transition boundary leave a valid workspace with no orphaned claim, branch or worktree created by the failed attempt.
- `contract execute` still launches a fresh executor whose intent input is the deterministic brief. `contract start` clearly supports the caller continuing in the returned worktree and labels that mode inherited-context.
- A completed human/assistant chat exchange survives board process restart and appears in stable order. Streaming deltas, hidden reasoning and raw tool output are absent from persisted files.
- A proposed chat action names the exact entity and transition. One explicit human approval applies it once, is durably linked to the human event and remains visible after restart.
- Ambiguous chat text, agent messages and duplicate submissions cannot approve an action. Rejection and failed application are durable and do not change lifecycle state.
- Chat-first paths cover contract sign, observation disposition, review accept/request-changes, contract close and batch close; equivalent CLI paths continue to pass their existing tests.
- The chat timeline has verified loading, empty, error, success and disabled states; keyboard operation and accessible names pass component tests and an axe check.
- Existing workspaces migrate or read compatibly with no required manual transcript creation, and `kotta validate` verifies all new canonical records and references.
- `npm test`, `npm run typecheck`, `npm run build` and `npm run test:site` pass.
- The pull request is reviewed and merged; GitHub Pages serves the updated site, and the tagged minor version is installable as `kotta` from npm with the new UI and CLI behaviour.

## Verification

- Unit tests for control-root discovery, event validation, stable ordering, approval scope/consumption and mutation-lock cleanup.
- Integration tests invoke lifecycle commands from both the base checkout and linked worktrees, including duplicate, concurrent and injected-failure cases.
- Extend `tests/integration/contract-execute.test.ts`, `contract-flow.test.ts`, `observation.test.ts`, `review-close.test.ts`, `ui-data.test.ts` and `ui-cli.test.ts` for the new state routing and execution choices.
- Component tests cover persisted timeline rendering, action cards, retries, keyboard focus, responsive markup and accessible status announcements.
- Restart test: send a human message, complete an assistant response, stop and restart the board, then assert byte-identical visible history and action state.
- Full local verification: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:site`, and `npm run verify:pack`.
- Pre-landing diff review and GitHub CI must pass before merge.
- Post-deploy: verify the GitHub Pages URL loads with no critical console error, install the tagged npm version into a clean temporary project, and exercise `kotta --version`, `kotta init`, board startup and both execution-mode help paths.

## Constraints

- `.kotta/` remains the canonical plain-file source of truth and every mutation goes through validated Kotta services.
- The control branch defaults to existing `git.base_branch`; do not introduce a second state branch by default.
- Cross-worktree state changes must never update a checked-out branch ref behind Git's back. Mutate through its actual control worktree under a lock.
- Preserve old sequential ids, minted ULIDs, `.a-team/` compatibility and current workspace migration behaviour.
- Keep agent execution offline and deterministic apart from the explicitly selected provider process.
- Approval records must not claim cryptographic human identity that Kotta cannot prove; they record the actual UI interaction and source event.
- No force push, destructive cleanup or direct mutation of protected implementation branches.

## Open decisions

None.

## Execution notes

- Product direction was supplied by the human in chat: main/base control plane, persistent visible contract chat, chat-first scoped approvals, fresh execution by default with caller execution available, and deployment of both the site and npm package.
- `src/commands/ui.ts` already has an ephemeral Codex thread and a direct sign endpoint; evolve these rather than adding a second chat server or transition implementation.
- `readWorkspace()` currently reads the base ref and overlays active worktree state. Replace the overlay as canonical state becomes live on the base control worktree; retain explicit diagnostics for stale legacy worktrees during migration.
- `startContract()` currently moves the contract and claim only inside the feature worktree. Its ordering and rollback are the highest-risk part of this contract.
- `locateExecutionContext()` currently looks for the claim inside `.worktrees/<id>`; claims move to the control plane while the worktree path remains execution metadata.
- Prefer one immutable event file per event, named by sortable collision-resistant id, over a shared append-only file that creates merge and partial-write hazards.
- Commit completed chat turns and lifecycle events to the control branch in small Kotta-owned commits. Never persist token-by-token deltas.
- Package release is a minor SemVer bump because this adds backward-compatible workflow and UI capabilities. Follow `README.md` maintainer release rules and the existing tag-driven npm workflow.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Starting a contract from `main` or a linked worktree yields exactly one claim, feature branch and worktree; the canonical contract becomes active on the configured base branch and the board shows it without merging the feature branch. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Review, discovered observations and close invoked from a contract worktree update the control plane and are immediately visible to the board. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Feature branches do not acquire divergent active/review/done copies of canonical contract state, and merging implementation code does not create duplicate lifecycle files. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Concurrent mutations are serialized; injected failures at each start transition boundary leave a valid workspace with no orphaned claim, branch or worktree created by the failed attempt. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| `contract execute` still launches a fresh executor whose intent input is the deterministic brief. `contract start` clearly supports the caller continuing in the returned worktree and labels that mode inherited-context. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| A completed human/assistant chat exchange survives board process restart and appears in stable order. Streaming deltas, hidden reasoning and raw tool output are absent from persisted files. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| A proposed chat action names the exact entity and transition. One explicit human approval applies it once, is durably linked to the human event and remains visible after restart. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Ambiguous chat text, agent messages and duplicate submissions cannot approve an action. Rejection and failed application are durable and do not change lifecycle state. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Chat-first paths cover contract sign, observation disposition, review accept/request-changes, contract close and batch close; equivalent CLI paths continue to pass their existing tests. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| The chat timeline has verified loading, empty, error, success and disabled states; keyboard operation and accessible names pass component tests and an axe check. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| Existing workspaces migrate or read compatibly with no required manual transcript creation, and `kotta validate` verifies all new canonical records and references. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| `npm test`, `npm run typecheck`, `npm run build` and `npm run test:site` pass. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| The pull request is reviewed and merged; GitHub Pages serves the updated site, and the tagged minor version is installable as `kotta` from npm with the new UI and CLI behaviour. | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| workflow: happy_path_verified | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| workflow: failure_and_cancellation_paths_verified | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| workflow: authorization_and_idempotency_verified | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| ui: required_states_verified | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| ui: accessibility_verified | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |
| ui: visual_evidence_present | Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes. |

### Verification performed

Caller-chat MCP, CLI, read-only board API, wave Run integration and UI tests pass (37/37 after main integration); site Playwright passes 5/5; typecheck, build and pack allowlist pass for @arpadtamasi/kotta@0.5.0; PR #26 site-build check passes.

### Deviations

Per the human's later direction, approvals moved from the board drawer to the calling host chat through MCP elicitation; the board is now a read-only canonical projection. The CLI remains the terminal-first fallback.

### Observations created

F-01kz9c3h0jddvtwq4feaag2s6z records npm rejecting the unscoped name; F-01kz9d5nqwdwb7r2c0jdzchspa records the stale live-site quickstart.

### Known concerns

npm Trusted Publishing still needs to be configured for @arpadtamasi/kotta before a future first-time tag can publish without a maintainer's browser-authenticated fallback.
