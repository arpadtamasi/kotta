---
id: T-01kzdhtqw01nbgdg5dd9cw3zpr
title: The execution record is derived from what the run actually did
status: done
origin: human
types:
  - refactor
profiles:
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  refactor/T-01kzdhtqw01nbgdg5dd9cw3zpr-the-execution-record-is-derived-from-what-the-run-actually-d
pull_request: 'https://github.com/arpadtamasi/kotta/pull/31'
created_at: '2026-08-07'
updated_at: '2026-08-10'
assigned_agent: claude
worktree: .worktrees/T-01kzdhtqw01nbgdg5dd9cw3zpr
execution_mode: inherited
resolution: completed
---
# T-01kzdhtqw01nbgdg5dd9cw3zpr — The execution record is derived from what the run actually did

## Outcome

After any `contract execute`, the recorded state, the claim and the stored evidence describe what
actually happened in the worktree. A run that changed nothing is not called an implementation, a run
that did real work is never left unrecorded, the claim names the agent that ran, and what the agent
reported about itself survives the run. The lifecycle log becomes usable as the primary account of
an execution instead of a claim that must be re-verified against the worktree by hand.

## Actors

- Executor agent: runs in the contract worktree and produces commits, uncommitted changes, or
  nothing.
- Kotta executor (`runAgent`): launches the agent, judges the outcome, and writes the record.
- Control plane: holds the canonical contract, claim and event stream on the base branch.
- Human operator: reads the record to decide whether to review, resume or intervene.
- Reviewer (human or agent): later relies on the record to understand who did what.

## Initial state

- A contract is `active` with a claim, a feature branch and a worktree.
- The control worktree may be clean or dirty; dirt may come from unrelated work, or from Kotta's own
  uncommitted observation and index writes.
- The agent binary may or may not be capable of writing files under its configured invocation.

## States

An execution run resolves to exactly one recorded state:

- `cancelled` — the operator interrupted it.
- `agent-failed` — the agent could not be launched, exited non-zero, was signalled, or produced no
  output.
- `no-change` — the agent completed but the worktree is identical to the run's baseline. This state
  does not exist today and is the core addition.
- `implemented` — the agent completed and the worktree differs from the run's baseline.

`implemented` and `no-change` are both successful terminations of the process; only `implemented`
asserts that work was produced.

## Transitions

1. Before launching, the executor captures a baseline: the contract branch tip and the worktree's
   porcelain status.
2. The agent runs. Its stdout is captured and its stderr is forwarded live, as today.
3. After the agent settles, the executor compares the worktree against the captured baseline:
   new commits on the contract branch, or uncommitted changes, or neither.
4. The failure ladder is evaluated first and is unchanged. If it yields nothing, the comparison
   decides between `implemented` and `no-change`.
5. The record is written to the control plane: lifecycle event, execution outcome and the agent's
   own reported output.
6. Writing the record never depends on the cleanliness of unrelated files in the control worktree.
7. On a resume that names a different agent, the claim is updated to the agent that actually ran,
   before the record is written.

## Triggers

- `kotta contract execute <id> --agent <agent>`
- `kotta contract execute <id> --resume [--agent <agent>]`
- Operator interrupt (SIGINT/SIGTERM) during a run.
- Batch execution invoking the same executor.

## Permissions

- The executor writes the claim, the lifecycle event and the execution record. It does not move the
  contract's lifecycle state and does not commit the agent's work on its behalf.
- A recorded state is written by Kotta, never asserted by the agent. The agent's own account is
  stored as reported content, clearly attributed, and never promoted into the state decision.
- The human gates are unchanged: `sign`, `close`, `reopen` and observation `resolve` still require
  explicit human approval.
- Agent invocation arguments are configuration, not something an agent may alter at runtime.

## Error paths

- **Record write blocked by unrelated dirt.** Writing the execution record must not assert a clean
  control worktree. `runAgent` currently calls `withControlPlaneMutation` without
  `requireClean: false`, so `assertClean` destroys the record of completed work; every sibling
  caller already passes `requireClean: false`.
- **Record write fails for a real reason** (lock timeout, I/O). The failure is reported naming the
  run that is at risk, the worktree is left untouched, and the operator is told the work exists but
  is unrecorded. Silence is not acceptable.
- **The agent cannot write at all.** An invocation that structurally prevents file changes must be
  a launch-time error, not a successful-looking empty run.
- **Baseline capture fails.** The run is refused before the agent starts rather than proceeding
  without a comparison point.
- **Misleading messages.** An error raised while finishing a run must not tell the operator that
  something failed to start.

## Cancellation path

- An interrupt still terminates the agent and records `cancelled`, keeping the claim and worktree
  for inspection.
- A cancelled run still records the baseline comparison and the captured output, because partial
  work is exactly what the operator must decide about.
- Cancellation never deletes or reverts anything in the worktree.

## Retry and duplicate-action behaviour

- A resume appends a new run record; it never rewrites or replaces the previous one. A contract with
  a `no-change` run followed by an `implemented` run shows both, in order.
- Repeating a plain `execute` on a contract that already has a context is still refused.
- A resume that names a different agent updates the claim once and records the change, so a later
  bare resume relaunches the agent that actually ran.
- Re-recording the same run is not possible: each run writes exactly one execution event.

## Audit and notification expectations

- Each execution event records the resolved state, the agent that ran, the baseline and resulting
  commit, whether uncommitted changes remain, and the exit code.
- The agent's reported output is persisted with the run and attributed as the agent's own claim
  rather than as verified fact. Streaming deltas and raw tool logs remain unpersisted.
- A `no-change` outcome is stated plainly in human output and names what to check.
- The claim always names the agent of the most recent run.
- No secrets are persisted; the stored output is what the agent printed, nothing more.

## Scope

1. Capture a pre-run baseline (contract branch tip plus worktree status) before the agent launches.
2. Add the `no-change` execution state and decide between it and `implemented` by comparing against
   that baseline, after the existing failure ladder.
3. Persist the agent's captured stdout with the run record, attributed as the agent's own report.
4. Pass `requireClean: false` where the execution record is written, matching every sibling caller,
   so unrelated dirt cannot destroy a completed run's record.
5. Update the claim's agent on a resume that names a different one, before the record is written.
6. Make an invocation that cannot write a launch-time error, and fix the configured `claude`
   arguments so the supported agent can actually work.
7. Correct the error message raised while finishing a run so it does not describe starting.
8. Add coverage for each of the above, including a no-change run, a dirty-control-worktree run, and
   a resume that switches agent.

## Non-goals

- Judging whether the produced work is correct or complete. This contract is about faithful
  recording, not quality assessment.
- Committing the agent's work automatically, or changing who commits.
- Changing the lifecycle states of contracts, or any human gate.
- Adding a new agent, changing the launch seam, or introducing an agent plugin system.
- Persisting streaming deltas, hidden reasoning or raw tool output.
- Redesigning the board or the event schema beyond the fields this contract adds.

## Acceptance

- An agent that exits 0, prints output and changes nothing is recorded as `no-change`, and the human
  output says so plainly. It is not recorded as `implemented`.
- An agent that commits its work is recorded as `implemented`, and an agent that leaves only
  uncommitted changes is also recorded as `implemented`. Neither is misreported as empty.
- A run that completes while the control worktree holds unrelated dirt still writes its execution
  event and its state commit. Reproducing the 2026-08-07 failure with an untracked file present no
  longer loses the record.
- The agent's reported output is retrievable from the stored record after the run, and is labelled
  as the agent's own account rather than as a verified outcome.
- `execute --resume --agent <other>` leaves the claim naming `<other>`, and a subsequent bare
  `--resume` relaunches `<other>`.
- Invoking the configured `claude` agent produces file changes for a task that requires them; an
  invocation that structurally cannot write fails at launch with a message naming the cause.
- No error raised after the agent has run describes the failure as occurring before starting.
- Existing `cancelled` and `agent-failed` behaviour is unchanged and its tests pass unmodified.
- `kotta validate`, `npm run typecheck` and the full suite pass.

## Verification

- `npx vitest run tests/integration/contract-execute.test.ts` — no-change, implemented via commit,
  implemented via uncommitted changes, cancelled and agent-failed, using the existing launcher
  double.
- A test that dirties the control worktree with an unrelated untracked file, runs an execution to
  completion, and asserts the execution event and state commit exist.
- A test that resumes with a different agent and asserts the claim names it afterwards.
- A test asserting the stored record contains the agent's reported output.
- Manual: run a real `claude` execution on a task requiring an edit and confirm files change.
- `npm run typecheck`, and `npx vitest run` for the full suite.

## Constraints

- `.kotta/` remains the canonical source of truth and every write goes through the validated
  services and the control-plane mutation lock.
- The existing failure ladder keeps its order and its messages; `no-change` is evaluated only after
  it yields nothing.
- Event files stay immutable and append-only. A wrong earlier record is corrected by a later event,
  never by rewriting history.
- Do not persist anything beyond what the agent printed.
- The launch seam (`KOTTA_AGENT_COMMAND`) must keep working so tests can substitute a double.

## Open decisions

None.

## Execution notes

- This contract exists because five separate observations turned out to be one missing property.
  Sources: F-01kzdax5af5edadf83rq792eky (implemented never checks for change),
  F-01kzdaxefyc4jxk1hwe3z74k41 (agent stdout discarded),
  F-01kzdaxs0133htw4ws8m4rw9a3 (resume does not update the claim),
  F-01kzdebgbn97ve9bby1me3jkh4 (the claude invocation lacks a permission flag),
  F-01kzdhg6mx6ght9h4m504w65gs (a dirty control worktree discards a completed run's record).
- Fixing any one alone leaves the property unestablished. In particular, a change-detection guard is
  worthless while the claude invocation guarantees zero changes, and both are worthless if the
  record is discarded at write time.
- The decisive code sites: `src/commands/execute.ts:225` launches, `:228-236` is the failure ladder,
  `:239` computes `uncommittedChanges` and never uses it, `:258` writes the record without
  `requireClean: false`, `:171` resolves the resume agent without updating the claim, and the
  `AGENT_ARGUMENTS` table near the top holds the `claude: ["-p"]` invocation.
- `src/git/control-plane.ts:94` is where the clean assertion fires; the sibling callers that already
  opt out are in `observation.ts`, `conversation.ts`, `approval.ts` and `mcp.ts`.
- `uncommittedChanges === false` is the normal successful outcome, because the agent is expected to
  commit. Do not guard on it alone; compare against the captured baseline.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| An agent that exits 0, prints output and changes nothing is recorded as `no-change`, and the human | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| An agent that commits its work is recorded as `implemented`, and an agent that leaves only | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| A run that completes while the control worktree holds unrelated dirt still writes its execution | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| The agent's reported output is retrievable from the stored record after the run, and is labelled | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| `execute --resume --agent <other>` leaves the claim naming `<other>`, and a subsequent bare | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| Invoking the configured `claude` agent produces file changes for a task that requires them; an | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| No error raised after the agent has run describes the failure as occurring before starting. | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| Existing `cancelled` and `agent-failed` behaviour is unchanged and its tests pass unmodified. | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| `kotta validate`, `npm run typecheck` and the full suite pass. | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| workflow: happy_path_verified | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| workflow: failure_and_cancellation_paths_verified | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |
| workflow: authorization_and_idempotency_verified | Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes. |

### Verification performed

Baseline: captureBaseline records the branch tip and porcelain status before launch; inspectWorktree compares after, and an unreadable worktree counts as changed so Kotta never reports an empty run it could not verify. no-change is reached only when the existing failure ladder yields nothing. Record: appendEvent stores state, agent, agent_command, resumed, exit_code, baseline_commit, commit, uncommitted_changes and agent_report (source 'agent stdout', verified false), written with requireClean: false so unrelated dirt cannot discard a completed run; a write that fails for a real reason returns EXECUTION_UNRECORDED naming the branch and worktree. Claim: rewriteClaimAgent points the claim at the agent that actually ran, validated before write, in the same mutation as the record. Invocation (revised after review): AGENT_ARGUMENTS carries no permission mode; agents.permission_mode in .kotta/config.yaml is appended as --permission-mode by resolveAgentCommand, absent by default so the agent's own project settings decide and no launched run receives authority the caller had not granted; invocationWriteFailure refuses only a mode that forbids edits by definition (plan), and invocationWriteWarning names the config key when nothing is set, with the baseline comparison then reporting no-change. init writes agents.permission_mode: null. Tests: 22 in contract-execute (including a configured mode reaching the invocation, a plan mode refused before any context exists, no-change, uncommitted-is-implemented, dirty control worktree, record-write failure, resume switching agent) and 3 new unit tests covering the failure, the warning and the config read. Full suite 40 files / 257 passed / 1 skipped; npm run typecheck and npm run build pass; kotta validate passes.

### Deviations

The change request on the agent invocation was implemented as a workspace-configured mode rather than by reading the calling session's mode directly: a spawned 'claude -p' already resolves the project's own .claude/settings.json, so absence of a Kotta flag is what makes the run inherit the caller's authority. The requested launch-time refusal is kept for a mode that structurally cannot write, and is a warning rather than a refusal when nothing is configured, because Kotta cannot read the agent's settings and must not refuse a run that would in fact have succeeded.

### Observations created

None during this revision. Six were recorded during the original execution and dispositioned then.

### Known concerns

The agent's full stdout is stored in the execution event with no size bound (F-01kzhnaxhwsvx2b7v5mfs2s13yd), recorded separately and not addressed here. This branch merges current main, which added kotta sync; two shipped SKILL.md files change here, so kotta sync should be run after integration to keep installed skills from reporting as drifted.
