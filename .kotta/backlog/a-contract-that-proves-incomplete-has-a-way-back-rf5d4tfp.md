---
id: T-01kzhnsncw8znqdn14rf5d4tfp
title: A contract that proves incomplete has a way back
status: backlog
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
branch: null
pull_request: null
created_at: '2026-08-08'
updated_at: '2026-08-08'
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
   exposed, so it is not a terminal-only escape hatch.
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
- The four observations are the evidence and should be dispositioned against this contract rather
  than resolved separately.
- Two of them were recorded during the same session that found the defect, and one carries a wrong
  cross-reference to a sibling observation; the correct ids are the ones in the table above.
