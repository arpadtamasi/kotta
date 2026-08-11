---
id: T-01kzrdybqzgpmv3ff0wqv7bbf8
title: 'Objectless work is retired by name, and the record says what superseded it'
status: active
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
  feat/T-01kzrdybqzgpmv3ff0wqv7bbf8-objectless-work-is-retired-by-name-and-the-record-says-what-
pull_request: null
created_at: '2026-08-11'
updated_at: '2026-08-11'
assigned_agent: claude
worktree: .worktrees/T-01kzrdybqzgpmv3ff0wqv7bbf8
execution_mode: inherited
---
# T-01kzrdybqzgpmv3ff0wqv7bbf8 — Objectless work is retired by name, and the record says what superseded it

## Outcome

A contract whose purpose has been removed — by a decision, by a duplicate, or by a change of mind —
is retired with `cancel` from whatever state it is sitting in, with a stated reason and a link to
whatever replaced it. `obsolete` stops being a word the workspace can write but never reach, and the
retirement record answers the question a reader has six months later: what killed this.

## Measured problem

On 2026-08-11, in `goschool-web`, the active contract *A három újonnan írt magyar útvonal és a
kérdőív angol slugra mozgatása* became objectless. It was not half-finished; a decision had since
established that Hungarian pages keep Hungarian slugs on `goschool.hu`, so finishing the contract
would implement the opposite of the standing decision.

Kotta has the word and not the path. `cancelContract` accepts the resolutions
`duplicate | obsolete | cancelled` (`src/commands/contract.ts:309`) — `obsolete` is exactly the
outcome needed — but the command accepts only `backlog` and `defined`
(`src/commands/contract.ts:316`) and refuses outright when a claim exists
(`src/commands/contract.ts:319`). The three exits actually offered to the operator were: leave the
contract `active` forever, `close --approve` it as `completed` (a false record of work that was
never merged and never wanted), or hand-edit `.kotta/` — the one rule the workspace states about
itself.

| # | Hole | Observation |
| --- | --- | --- |
| 1 | An `active` contract cannot be cancelled: `cancel` takes `backlog`/`defined` only, and refuses a claimed contract outright. | `F-01kzrc4apc1660d4z37c1nf5nw` |
| 2 | A `review` contract cannot be abandoned: `reopen` returns it to `active`, where `cancel` refuses again. | `F-01kzm9hppbvg3gxzj48xccqsm9` |
| 3 | A cancellation records a one-word resolution and nothing else — no reason, and no link to whatever superseded the work. | `F-01kzrc4apc1660d4z37c1nf5nw` |

`T-01kzhnsncw8znqdn14rf5d4tfp` closes the first hole sideways: `revise` takes an `active` contract to
`backlog`, from where `cancel` accepts it. That is a path, in two commands, and the first one
misnames what happened — `revise` records that the definition was incomplete, when the definition was
correct and the world moved on. Retirement deserves its own verb, and it already has one.

## Actors

- **Human.** Approves the retirement. The decision is theirs because it ends work they approved
  starting, and because only they know whether the work is objectless or merely stalled.
- **Calling agent.** Notices that the contract's purpose is gone, names in chat what removed it, and
  runs the command on an explicit yes.
- **Kotta.** Validates the transition, releases execution resources, records the resolution, the
  reason, the superseding entity and the approval receipt, and refuses whatever would lose work.

## Initial state

A contract in `backlog`, `defined`, `active` or `review`. In `active` it holds a claim, a branch and
a worktree, all created by `start`. In `review` it holds all three still: `review` moves the file and
leaves the claim in place. The worktree may contain committed work, uncommitted work, or nothing.

## States

- `backlog`, `defined` — no claim, no execution resources. Cancellable today.
- `active` — claimed, with a branch and a worktree.
- `review` — submitted, claim retained, branch unmerged.
- `done` — out of this contract's path. A retired contract is already there, and `reopen` owns the
  way back.

## Transitions

- `backlog → done` and `defined → done` via `contract cancel <id> --resolution <resolution>
  --reason "…" [--superseded-by <id>] --approve`. Unchanged except that the reason and the
  superseding entity are now recorded.
- `active → done` via the same command. The claim is released, the execution worktree is removed when
  it is present and clean, and the branch is preserved.
- `review → done` via the same command, with the same cleanup. This is the exit `review` does not
  have today.
- `done → *` — refused. A retired contract reopens; it does not cancel twice.

No transition here merges anything, and none deletes a branch. `close` deletes a branch because it
has been merged; a cancelled branch never has been, so it stays.

## Triggers

- A decision is recorded that removes the contract's purpose.
- The work is found to duplicate another contract after it was started or submitted.
- The work is abandoned outright and nothing replaces it.

## Permissions

- `--approve` and an explicit human yes in the conversation, recorded the way `sign` and `close`
  already record theirs. Retiring live work costs an approval.
- `--reason "…"` is required, from every state. A retirement with no stated cause is the fact this
  contract exists to stop losing.
- `--superseded-by <id>` is optional for `cancelled` and **required** for `duplicate` and `obsolete`.
  Those two words assert that something else took this work's place; naming it costs one argument.
  Work that is obsolete with nothing in the workspace to point at is `cancelled` with a reason, which
  is the truthful record.
- `contract.cancel` joins the gated approval actions, so the calling chat can retire work through the
  same surface as `sign` and `close` rather than sending the human to a terminal.

## Error paths

- **Uncommitted work in the execution worktree.** Refuses, names the worktree, changes nothing —
  state, claim, branch and worktree all as they were. Work is never discarded to make a retirement
  possible.
- **Contract already `done`.** Refuses and names `reopen`, whether the existing resolution is
  `completed` or a cancellation.
- **Missing `--approve`, missing `--reason`, or a missing `--superseded-by` where the resolution
  requires one.** Refuses with the message shape `sign` and `close` use.
- **`--superseded-by` naming an id that does not exist, or naming the contract itself.** Refuses. A
  dangling link is worse than none, because it reads as an answer.
- **Missing worktree for an `active` or `review` contract.** The claim is released and the contract
  retired. A claim whose worktree vanished must not trap the contract forever; that is the defect
  being fixed, not a second one to introduce.
- **Control worktree dirty.** The same `requireClean` treatment as the sibling mutations, so Kotta's
  own uncommitted writes cannot block a retirement.

## Cancellation path

The command is itself the cancellation path this workspace was missing. Its own cancellation is the
human declining the elicitation: a rejected or cancelled approval is durable, is recorded as such,
and changes no state. There is no partial retirement — the control-plane mutation commits as one
unit, or the contract stays exactly where it was, claim included.

## Retry and duplicate-action behaviour

- A second `cancel` on a contract already retired refuses, naming the state and the recorded
  resolution. It is not silently idempotent: a caller who believes a retirement is pending is in a
  different situation from one whose retirement already happened.
- A `cancel` interrupted before its commit leaves the contract in its original state with its claim
  intact, from which the command runs again unchanged.
- A repeated `approval_request` for the same `contract.cancel` reuses the existing proposal and
  reports its terminal phase, as the other gated actions already do.

## Audit and notification expectations

- The contract's frontmatter carries `resolution`, `cancellation_reason` and, when given,
  `superseded_by`. `kotta contract show` prints them without change, because it renders every
  frontmatter fact generically.
- The lifecycle event carries the previous state, the resolution, the reason, the superseding id and
  whether a claim was released — so the timeline says why the work ended, not only that it did.
- The approval receipt is recorded as for `sign` and `close`.
- `kotta show decision <id>` lists the contracts whose `superseded_by` names that decision, so the
  link reads from both ends without the decision file changing.
- The command's result names any contract that declares `depends_on` the retired one. It does not
  cascade; it makes the consequence visible to the human who just approved it.

## Scope

1. `cancelContract` (`src/commands/contract.ts:311-345`) accepts `active` and `review` in addition to
   `backlog` and `defined`. For those two it removes the claim, removes the execution worktree when
   present, and preserves the branch — reusing the clean-worktree guard `closeContract` already has
   at `src/commands/contract.ts:280`, which tolerates an absent worktree.
2. `--reason "…"`, required, stored as `cancellation_reason` and carried in the lifecycle event.
3. `--superseded-by <id>`, validated to name an existing contract or decision, stored as
   `superseded_by`, required for `duplicate` and `obsolete`.
4. `contract.cancel` as a gated approval action: `APPROVAL_ACTIONS` and the `apply` switch
   (`src/commands/approval.ts:12-18`, `:74-83`), its `assertApplicable` state rule and
   `approvalDescription` detail, its payload validation, the MCP enum (`src/commands/mcp.ts:237`) and
   the prose sentence listing the gated actions (`src/commands/mcp.ts:48`).
5. `showCommand` lists contracts superseded by a decision when the shown entity is a decision
   (`src/commands/show.ts`).
6. Dependents of the retired contract are reported in the command's result.
7. Documentation: the lifecycle tables in `README.md` and `AGENTS.md` name `cancel` as the exit for
   work that should not continue, from any state; the `close-contract` and `execute-contract` skills
   point at it instead of leaving retirement unnamed.
8. Tests for every transition and every error path above. `cancel` has no test today.

## Non-goals

- Any change to `close`, `reopen` or `revise`. `T-01kzhnsncw8znqdn14rf5d4tfp` owns `revise` and
  states that `cancel` is untouched by it; this contract is the other half and touches nothing of
  its.
- Deleting the branch of a cancelled contract. Unmerged commits are the only copy of that work.
- Editing decision files. `DECISION_FIELDS` is `id`, `title`, `date`, and it stays that way: the link
  is stored on the contract, and the decision's view of it is derived at read time.
- Cascading cancellation to dependent contracts. Retiring work is a judgement per contract, and a
  cascade would retire work the human never saw named.
- Recovering or reviewing the work in a cancelled branch. That stays the operator's call.
- Defining when work counts as objectless. That is the human's judgement in the conversation, and no
  command can make it.

## Acceptance

- `kotta contract cancel <id> --resolution obsolete --reason "…" --superseded-by <decision-id>
  --approve` retires an `active` contract: the claim is gone, the execution worktree is removed, the
  branch still exists, and the contract is in `done` with `resolution: obsolete`,
  `cancellation_reason` and `superseded_by` in its frontmatter.
- The same command retires a `review` contract, with the same result.
- The same command still retires a `backlog` and a `defined` contract, now recording the reason.
- Cancelling without `--approve` refuses; without `--reason` refuses; with `--resolution obsolete` or
  `duplicate` and no `--superseded-by` refuses; with a `--superseded-by` that names no existing
  entity refuses; on a `done` contract refuses and names `reopen`.
- Cancelling an `active` contract whose execution worktree has uncommitted changes refuses, names the
  worktree, and changes nothing: state, claim, branch and worktree are all as they were.
- Cancelling an `active` contract whose worktree is missing succeeds and releases the claim.
- The lifecycle event for a cancellation carries the previous state, the resolution, the reason, the
  superseding id and whether a claim was released; the approval receipt is recorded as for `close`.
- `kotta show decision <id>` lists the contracts that name it in `superseded_by`.
- The calling chat can retire a contract through `approval_request` with `contract.cancel`, without
  the human running a command.
- A cancelled `review` contract validates without review evidence, and `kotta validate` passes.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run tests/integration/contract-flow.test.ts` — cancel from `backlog`, `defined`,
  `active` and `review`, and each refusal listed above.
- A test asserting an `active` cancellation removes the claim and the worktree and leaves the branch
  resolvable with `git rev-parse`.
- A test asserting a cancellation on a dirty execution worktree changes nothing: state, claim, branch
  and worktree unchanged.
- A test asserting the lifecycle event carries the previous state, resolution, reason, superseding id
  and claim-release flag, and one asserting the approval receipt.
- A test asserting `show decision` lists a superseding decision's retired contracts.
- A test asserting a cancelled `review` contract passes `validateContractFile` with no review
  evidence.
- `npx vitest run --exclude '.worktrees/**'` — the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: sign a throwaway contract, start it, retire it as `obsolete` naming a decision, and confirm
  `kotta status`, `kotta contract show` and `kotta show decision` all say what killed it, with no
  `.kotta/` file edited by hand.

## Constraints

- `.kotta/` stays canonical and every mutation goes through the validated services.
- A retirement never destroys work. An unclean execution worktree stops it, and the branch survives
  it.
- No step may leave a contract in a state no command accepts. That is the defect being fixed;
  reproducing it inside the fix would be worse than the defect.
- Approval is a human gate and stays one.
- No cancellation without a stated reason, and none claiming supersession without naming what
  superseded it.

## Open decisions

None.

## Execution notes

- **Collides with `T-01kzhnsncw8znqdn14rf5d4tfp` ("A contract that proves incomplete has a way
  back"), which is `active` and already implemented in `.worktrees/T-01kzhnsncw8znqdn14rf5d4tfp`
  (commit `48413a6`) but not submitted.** It adds `contract.revise` to the same approval enum and the
  same prose sentence, and touches neighbouring lines in `src/commands/contract.ts`. Neither blocks
  the other and no ordering is imposed here; whichever lands second rebases onto the other's surface
  and owns the reconciliation. Say in the review evidence which order actually happened.
- **Collides with `T-01kzda6nj9hd2z45tt06fw8n0g` ("One operation registry derives both the CLI and
  the MCP surface"), signed and not started.** It states as a behavioural invariant that "the same
  five actions stay gated". With `revise` and `cancel` it is seven. If the registry lands first,
  `cancel` is added as a registry entry rather than a hand-written pair of registrations.
- `cancel` has no test coverage today, and the CLI is its only caller (`src/cli/index.ts:271-276`).
  The change is therefore cheap to make and expensive to leave untested.
- `src/core/validation.ts:56-57` already exempts cancelled resolutions from the review-evidence
  requirement, so a cancelled `review` contract validates without inventing evidence. No validation
  change is needed for that; confirm it with a test rather than assuming it.
- Do **not** reuse `releaseClaim` (`src/commands/claim.ts:30-46`) for the claim release here: it
  refuses a missing worktree, which would trap exactly the contract this command exists to free.
  Mirror `closeContract`'s cleanup instead.
- Contract frontmatter is not key-restricted (`src/core/validation.ts` checks sections and known
  values, not the key set), so `superseded_by` and `cancellation_reason` need no schema change, and
  `showCommand` (`src/commands/show.ts:27-34`) renders them without being told to.
- The two observations that are the evidence — `F-01kzrc4apc1660d4z37c1nf5nw` and
  `F-01kzm9hppbvg3gxzj48xccqsm9` — should be dispositioned against this contract rather than resolved
  separately.
