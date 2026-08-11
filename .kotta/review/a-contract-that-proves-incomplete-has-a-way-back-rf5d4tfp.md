---
id: T-01kzhnsncw8znqdn14rf5d4tfp
title: A contract that proves incomplete has a way back
status: review
origin: human
types:
  - feature
profiles:
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01kzhnsncw8znqdn14rf5d4tfp-a-contract-that-proves-incomplete-has-a-way-back
pull_request: 'https://github.com/arpadtamasi/kotta/pull/35'
created_at: '2026-08-08'
updated_at: '2026-08-11'
assigned_agent: claude
worktree: .worktrees/T-01kzhnsncw8znqdn14rf5d4tfp
execution_mode: inherited
---
# T-01kzhnsncw8znqdn14rf5d4tfp — A contract that proves incomplete has a way back

## Outcome

A contract discovered to be incomplete after it was signed — or after it was started — can be
corrected through a supported command, with a human approval and a recorded reason. The rule that
`.kotta/` is never hand-edited stops being a rule the workflow itself forces an operator to break.

## Measured problem

On 2026-08-08, in `ezchops/oneanda`, contract `T-01kzhdb2s5ehvycvr1hdwgmw60` was signed, started, and
handed to a fresh executing context. The calling chat said, in the same breath, that the fresh run
"nem tudja, amit ma itt kiderítettünk". The run was stopped on that ground, and a review of the
conversation against the contract found **eight facts present in the chat and absent from the
contract**.

Rule 8 covers exactly this case: record the gap, do not widen your context. Following it led nowhere,
and the workspace is closed at four points:

| # | Hole | Observation |
| --- | --- | --- |
| 1 | An `active` contract's body cannot be revised: `define` needs `backlog`, `reopen` needs `review`/`done`, `cancel` needs `backlog`/`defined`. | `F-01kzhna04m3pnghkchc26y53yb` |
| 2 | The recorded gap is unreachable: `briefContract` assembles the contract, its decisions, its profiles and its claim — never observations. | `F-01kzhna04m3pnghkchc26y53yb` |
| 3 | `claim release --force` deletes the claim but leaves the contract at `active`, where no command accepts it. | `F-01kzhnkbpdfc2v4bste7bbdr58` |
| 4 | A signed but unstarted contract is revisable only by routing it through `cancel` and `reopen`, recording a retirement that did not happen. | `F-01kzhjhe5t9exnxr4fxvjsfgbq` |

Every exit observed was a hand-edit of `.kotta/`, taken knowingly and with explicit human approval,
against the rule the same workspace states. A workflow whose only working path is the one it forbids
is not enforcing that rule; it is documenting an exception it refuses to name.

## Actors

- **Human.** Approves a revision. The decision is theirs because a revision withdraws an approval
  they gave: signing said this contract was ready, and revising says it was not.
- **Calling agent.** Discovers the gap, asks for the revision in chat, runs the command on an
  explicit yes, and writes the corrected definition.
- **Kotta.** Validates the transition, releases execution resources, records the reason and the
  approval receipt, and refuses whatever would lose work.

## Initial state

A contract in `defined` or `active`. In `active` it holds a claim, a branch and a worktree, all
created by `start`. The worktree may contain committed work, uncommitted work, or nothing.

## States

- `backlog` — revisable. `contract define --from` applies a new definition.
- `defined` — signed, not started. No claim.
- `active` — claimed, with a branch and a worktree.
- `review`, `done` — out of this contract's path; `reopen` already serves them.

## Transitions

- `defined → backlog` via `contract revise <id> --reason "…" --approve`. The contract's body is left
  as it stands; the state and the frontmatter are reset so a new definition can be applied.
- `active → backlog` via the same command. The claim is released first, by the existing release
  guard: the execution worktree must be clean, and the branch and worktree are preserved.
- `active → defined` via `claim release --force`, which today ends at `active`. Release becomes the
  exact inverse of `start`, which is what its own message already claims.
- `defined → active` via `start`, unchanged except that a contract already recording a branch and an
  existing worktree reuses them rather than failing to create them a second time.

## Triggers

- The calling agent finds, before or during execution, that the contract does not state something the
  executing agent needs.
- An operator releases a claim to recover a stuck execution and intends to run it again.

## Permissions

- `contract revise` requires `--approve` and an explicit human yes in the conversation, recorded the
  way `sign` and `close` already record theirs. It withdraws an approval, so it costs one.
- `--reason "…"` is required, not optional. A revision without a stated cause is the thing this
  contract exists to stop being invisible.
- `claim release` keeps `--force`; its scope widens, not its gate.
- No transition here bypasses `sign`. A revised contract is re-signed like any other.

## Error paths

- **Uncommitted work in the execution worktree.** `revise` refuses, naming the worktree, exactly as
  `claim release` does today. Work is never discarded to make a revision possible.
- **Contract in `review` or `done`.** `revise` refuses and names `reopen`, which already owns those.
- **No approval.** `revise` refuses with the same message shape as `sign` and `close`.
- **Missing worktree for an active contract.** `revise` refuses and names the worktree, as release
  does; a claim whose worktree vanished is a recovery case, not a revision case.
- **Control worktree dirty.** The revision is written with the same `requireClean` treatment as its
  sibling mutations, so Kotta's own uncommitted writes cannot block it.

## Cancellation path

`cancel` is unchanged and stays the way to retire a contract that should not exist. `revise` is not a
retirement: the contract keeps its id, its history and its intent, and the lifecycle log says it was
revised, not cancelled. A contract routed through `cancel` and `reopen` to be edited — the only path
available today — records the opposite of what happened.

## Retry and duplicate-action behaviour

- A second `revise` on a contract already in `backlog` refuses, naming the state; it is not silently
  idempotent, because the caller believing a revision is pending is a different situation from one
  that already happened.
- A `revise` interrupted between releasing the claim and moving the contract leaves the contract at
  `defined` with no claim — the state `claim release` now produces — from which `revise` runs again.
  No step leaves the contract in a state no command accepts.
- Re-running `claim release` on a contract already at `defined` refuses, naming the absent claim.

## Audit and notification expectations

- `revise` appends a lifecycle event carrying the previous state, the reason, and whether a claim was
  released, and records the human approval receipt the way the other gated actions do.
- The reason appears in `kotta status` for the revised contract, so a contract that has been revised
  is visibly different from one that was never signed.
- `claim release` continues to report that the branch and worktree were preserved, and now also
  reports the state the contract returned to.

## Scope

1. `contract revise <id> --reason "…" --approve` in `src/commands/contract.ts`, accepted from
   `defined` and `active`, releasing an existing claim through the current release guard and moving
   the contract to `backlog`.
2. Register it on the CLI, and expose it to the calling chat the way the other gated actions are
   exposed, so it is not a terminal-only escape hatch. Concretely: add `contract.revise` to the
   `approval_request` action enum at `src/commands/mcp.ts:203`, and to the prose sentence at
   `src/commands/mcp.ts:45` that lists which actions route through it.
3. `claim release --force` returns an `active` contract to `defined` instead of leaving it at
   `active`.
4. `start` reuses a recorded branch and an existing worktree for a `defined` contract instead of
   failing to create them again — the case that release now makes reachable.
5. The lifecycle event, approval receipt and `status` reporting described above.
6. Documentation: the lifecycle table in `README.md` and `AGENTS.md`, and the `execute-contract` and
   `define-contract` skills, name `revise` as the answer to a contract that proves incomplete.
7. Tests for every transition and every error path above.

## Non-goals

- Defining what "complete" means, and adding the sign-time and handoff-time completeness checks to
  the `define-contract` skill. That is `F-01kzhnpeadvsq1yxhkcdtrdt8d`: a judgement about a
  conversation Kotta cannot see, and it belongs to the skill and the rules channel, not to a command.
  This contract gives that judgement somewhere to lead; it does not make it.
- Including observations in the brief. The fix for a gap the executor needs is to put it in the
  contract, which is what `revise` is for. Widening the brief would make the contract optional
  instead of complete.
- Any change to `reopen`, `cancel` or `close`. Their states are untouched.
- Editing a contract's body from a command. `revise` returns the contract to where `define` already
  works; it does not become a second definition path.
- Recovering work from an unclean execution worktree. That stays the operator's call, and `revise`
  refuses until it is resolved.
- Migrating contracts that are stranded today. There are none in this repository; a stranded contract
  elsewhere is repaired by the same commands once they exist.

## Acceptance

- `kotta contract revise <id> --reason "…" --approve` moves a `defined` contract to `backlog`, and
  `kotta contract define <id> --from <file>` then applies a new definition.
- The same command on an `active` contract with a clean worktree releases the claim, preserves the
  branch and worktree, and moves the contract to `backlog`.
- `revise` without `--approve` refuses; without `--reason` it refuses; on a `review` or `done`
  contract it refuses and names `reopen`.
- `revise` on an `active` contract whose worktree has uncommitted changes refuses, names the
  worktree, and changes nothing.
- `kotta claim release <id> --force` on an `active` contract leaves it at `defined`, and
  `kotta contract start <id> --agent <agent>` then succeeds against the preserved branch and
  worktree.
- After a `revise`, the contract's lifecycle events carry the previous state, the reason and whether
  a claim was released, and the approval receipt is recorded as for `sign` and `close`.
- `kotta status` shows the revised contract with its reason.
- The calling chat can perform a revision through the same structured surface as the other gated
  actions.
- No path in this contract requires editing a file under `.kotta/` by hand.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run tests/integration/contract-flow.test.ts` — revise from `defined`, revise from
  `active`, redefine after revise, and each refusal.
- A test asserting `claim release --force` leaves the contract at `defined` and that `start` then
  succeeds with the branch and worktree already present.
- A test asserting a revise on a dirty execution worktree changes nothing: state, claim, branch and
  worktree are all as they were.
- A test asserting the lifecycle event carries the previous state, the reason and the claim-release
  flag.
- `npx vitest run --exclude '.worktrees/**'` — the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: sign a throwaway contract, start it, revise it with a reason, redefine and re-sign it, and
  confirm no `.kotta/` file was edited by hand at any point.

## Constraints

- `.kotta/` stays canonical and every mutation goes through the validated services.
- A revision never discards work. Uncommitted changes in an execution worktree stop it.
- No step may leave a contract in a state no command accepts. This is the defect being fixed, and
  reproducing it inside the fix would be worse than the defect.
- Approval is a human gate and stays one. `revise` withdraws an approval; it does not grant itself
  one.
- The reason is mandatory and stored. A revision that does not say why is indistinguishable from the
  hand-edit this contract replaces.

## Open decisions

None.

## Execution notes

- The release guard to reuse is `releaseClaim` in `src/commands/claim.ts:30-46`: it already refuses a
  missing worktree and an unclean one, and already preserves the branch and worktree.
- The state constraints to relax are `src/commands/contract.ts:129` (`start` requires `defined`) and
  `src/commands/execute.ts:186` (`execute` requires `defined`). Neither changes here; scope item 4 is
  about `start` tolerating a branch and worktree that already exist.
- `reopenContract` (`src/commands/contract.ts`) is the closest existing shape — an approved backwards
  transition that rewrites frontmatter and moves the file — and is worth reading before writing
  `revise`, but it is not extended: its states stay `review` and `done`.
- **This contract collides with `T-01kzda6nj9hd2z45tt06fw8n0g` ("One operation registry derives both
  the CLI and the MCP surface"), which is signed and not started.** That contract derives both
  surface tables from one registry, and states as a behavioural invariant that "the same five actions
  stay gated": `contract.sign`, `observation.resolve`, `contract.close`, `contract.request-changes`,
  `batch.close`. This contract makes it six. Neither blocks the other, and no ordering is imposed
  here, but whichever lands second owns the reconciliation: if the registry lands first, `revise` is
  added as a registry entry rather than as a hand-written pair of registrations; if this lands first,
  the registry's invariant is six actions, not five, and its surface-snapshot tests must be written
  against the surface as it then stands. Say in the review evidence which order actually happened.
- `kotta observation new` without `--discovered-during` writes its file without committing
  (`F-01kzhjhsknj52aqr4mxfkbpp0q`), which leaves the control worktree dirty and makes the next
  lifecycle command refuse. Expect it while recording anything found during this work; it is not a
  fault of this contract's changes.
- The four observations are the evidence and should be dispositioned against this contract rather
  than resolved separately.
- Two of them were recorded during the same session that found the defect, and one carries a wrong
  cross-reference to a sibling observation; the correct ids are the ones in the table above.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `kotta contract revise <id> --reason "…" --approve` moves a `defined` contract to `backlog`, and | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| The same command on an `active` contract with a clean worktree releases the claim, preserves the | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| `revise` without `--approve` refuses; without `--reason` it refuses; on a `review` or `done` | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| `revise` on an `active` contract whose worktree has uncommitted changes refuses, names the | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| `kotta claim release <id> --force` on an `active` contract leaves it at `defined`, and | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| After a `revise`, the contract's lifecycle events carry the previous state, the reason and whether | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| `kotta status` shows the revised contract with its reason. | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| The calling chat can perform a revision through the same structured surface as the other gated | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| No path in this contract requires editing a file under `.kotta/` by hand. | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass. | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| workflow: happy_path_verified | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| workflow: failure_and_cancellation_paths_verified | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |
| workflow: authorization_and_idempotency_verified | Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests. |

### Verification performed

Acceptance 1: reviseContract in src/commands/contract.ts moves a defined contract to backlog; the test 'revise returns a signed contract to backlog, where define applies a new definition' then applies a new definition and asserts the changed body through contract show. Acceptance 2: from active it releases the claim, preserves branch and worktree, and moves to backlog — asserted with the claim file gone, the worktree present, the branch still listed, and a full round trip of define, sign and start onto what was kept. Acceptance 3: refusals without --approve, without --reason, and from review are each asserted, the last naming reopen; state is unchanged after each. Acceptance 4: 'uncommitted work in the execution worktree stops the revision and releases nothing' asserts the contract stays active and the claim file remains. Acceptance 5: 'claim release returns the contract to defined instead of stranding it in active' asserts contractState is defined and that start then succeeds against the preserved branch and worktree. Acceptance 6: the lifecycle event carries state backlog and a summary containing the reason, and appendCliApprovalAudit records contract.revise with previous_state, reason and claim_released; the approval path records it once, so the receipt is not duplicated. Acceptance 7: kotta status returns revisedContracts with id, title and reason, and the human output prints it — both asserted. Acceptance 8: contract.revise is in the approval_request enum and in the server instructions, with the reason validated in the payload. Acceptance 9: no path requires editing a file under .kotta/ by hand. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 43 files, 274 passed, 1 skipped, run alone. Constraint 'no step leaves a contract unreachable': revise ends in backlog and release ends in defined, both states every relevant command accepts; the revise round trip and the release-then-start path are each driven end to end in tests.

### Deviations

One, in start's reuse check. The contract asked start to reuse a recorded branch and worktree; the implementation proves reuse rather than assuming it — the path must already be a git worktree checked out on that contract's branch — and only then skips assertSafeWorktreePath. Assuming reuse from the path existing would have turned that guard off for a stray directory of the same name, which is the guard's actual purpose. Documentation was added outside scope again, for the reason recorded as F-01kzhnb1kesarhg9j0epxwst12g.

### Observations created

One, F-01kzr8jam55kzfy1v0jkybrpwd: nothing notices when a claim holder edits the control worktree instead of its execution worktree. It happened during this execution — two edits landed on the base branch because the shell's working directory had reset — and was recovered by hand. Recorded with --discovered-during.

### Known concerns

The full suite is load-sensitive: a run overlapping another suite reported one failure, and a later concurrent run reported four 15-second timeouts on tests that pass in 2-5 seconds alone. Run alone it is clean. The identity of the single earlier failure was not captured, so it is asserted to be contention rather than proven; this is F-01kzr7qxy1mv7kbz9m3d8hzz2q. revise records revision_reason in frontmatter, which no schema declares — validation accepts unknown fields today, so nothing rejects it, but nothing documents it either. The reason is not cleared by a later define, so a contract revised twice keeps only the most recent.
