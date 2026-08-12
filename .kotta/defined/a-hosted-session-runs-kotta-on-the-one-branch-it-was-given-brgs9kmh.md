---
id: T-01kztvgdxb60hx200mbrgs9kmh
title: A hosted session runs Kotta on the one branch it was given
status: defined
origin: human
types:
  - feature
profiles:
  - workflow
priority: high
risk: high
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-12'
updated_at: '2026-08-12'
---
# T-01kztvgdxb60hx200mbrgs9kmh — A hosted session runs Kotta on the one branch it was given

## Outcome

A repository with a single checkout — a hosted agent session, or a solo developer who never made a
second worktree — runs the whole Kotta lifecycle on the branch it is standing on: orienting,
defining, starting, reviewing and closing, without checking out the base branch and without Kotta
creating a second branch beside the one the host pushes from.

## Measured problem

Reported on 2026-08-12 from a hosted Claude Code session, which asked its operator: *"A kotta
`branch_pattern` értéke `{prefix}/{id}-{slug}`, tehát a `contract start` saját branchet akar nyitni —
a harness viszont a `claude/banalis-antitezisek-inkonzisztenciak-cb78cx` branchre köti a pusht.
Melyiken fusson a végrehajtás?"* The answer was *"a meglévő harness-branchen"*, recorded as
`D-01kztv9ysf77134nbqnw28mwg5`.

Scoping that revealed the session never gets far enough to matter. Measured in a throwaway
repository — `git init` on `main`, `kotta init`, commit, `git checkout -b claude/harness-branch`,
one checkout and no linked worktrees:

```
$ kotta status
Error: Configured control branch 'main' has no checked-out control worktree.
$ kotta contract new --title "Probe" --type feature
Error: Configured control branch 'main' has no checked-out control worktree.
```

`controlPlaneRoot` (`src/git/control-plane.ts:31-38`) resolves the canonical writer by filtering
`git worktree list` for the base branch and throws when there is none. Every mutation routes through
it, and so does `statusCommand` — a read-only orientation command fails for the same reason. The
guard is right where it was designed, with several worktrees and a real risk of two diverging copies;
with one checkout there is nothing to diverge from, and it only forbids using Kotta at all.

Three defects sit on top of each other, and the top one is the one that was reported:

| # | Hole | Observation |
| --- | --- | --- |
| 1 | A single checkout that is not on the base branch cannot run any command. | `F-01kztvbpa23qm3gdz4cxkkm5xz` |
| 2 | `start` always creates its own branch and worktree, so a host that already named the branch gets a second of each, and the claim records the one the code is not on. | `F-01kztt3mce0yk9pm7jd9dex3w5` |
| 3 | `git.branch_pattern` is required by the schema, written by `init`, and read by nothing; `branchName` is hardcoded. The reporting agent quoted the setting as if it governed the name. | `F-01kztt3mce0yk9pm7jd9dex3w5` |

## Actors

- **Host environment.** Provides the checkout and the branch, and pushes from it. It is not asked to
  change, and Kotta may not require it to check out another branch.
- **Calling agent.** Runs the lifecycle in that checkout, and must be able to tell from the claim
  which branch and which directory its work lives in.
- **Kotta.** Resolves the canonical writer, adopts what the environment provided, records what it
  did and did not create, and refuses only what is genuinely ambiguous.
- **Human.** Unchanged: the same approvals gate the same transitions.

## Initial state

A Git repository with a Kotta workspace, in one of four shapes: one checkout on the base branch; one
checkout on another branch; several worktrees with exactly one on the base branch; several with none
or more than one on it.

## States

Of the control plane, which is what every command resolves first:

- **single** — exactly one checkout. It is the control plane, on whatever branch it holds.
- **linked-resolved** — several worktrees, exactly one on the base branch. That one, as today.
- **ambiguous** — several worktrees, none or more than one on the base branch. Refused, as today.

Of an execution claim:

- **created** — Kotta made the branch and the worktree, and owns their cleanup.
- **adopted** — the environment provided them. Kotta records them and never removes them.

## Transitions

- **Any command → control plane resolved.** Worktree count decides before the branch does.
  `single` never consults the base branch; `linked-*` behaves exactly as it does today.
- **`defined → active` (created).** Unchanged: `start` renders a branch name, creates the branch and
  the worktree, and records `origin: created` on the claim.
- **`defined → active` (adopted).** In a `single` control plane on a non-protected branch, `start`
  records that branch and that checkout, creates nothing, and records `origin: adopted`.
- **`active → review`, `review → done`, `* → done` by cancel.** Unchanged in what they check; they
  already read the claim. Cleanup becomes conditional on `origin`: an adopted branch and checkout are
  released from the claim and never deleted or removed.

## Triggers

- A hosted session starts work in a repository it did not lay out.
- A developer with one checkout, standing on a feature branch, runs any Kotta command.

## Permissions

- No new human gate. Adoption is a fact about the environment, not a decision about the work, and the
  approvals that gate signing, closing, retiring and dispositioning are untouched.
- The protected-branch rule outranks adoption. A single checkout on `main` is a valid control plane
  and an invalid execution target: `start` refuses there exactly as it does today.
- Cleanup permission follows creation. Kotta may remove only what Kotta made.

## Error paths

- **Ambiguous control plane** — several worktrees, none on the base branch, or more than one. The
  present message stands, unchanged in wording.
- **`start` on a protected branch in a single checkout.** Refuses, naming the branch and the
  protected list. The workspace is still readable and every non-execution command still works.
- **`start` in a single checkout with uncommitted changes.** The existing clean-tree guard applies
  unchanged; adoption does not relax it.
- **An adopted branch that no longer exists at close.** `close` refuses as it does today for a
  missing branch; it does not fall back to deleting or recreating anything.
- **A rendered `branch_pattern` that produces an invalid or empty ref name.** Refuses at `start`,
  naming the pattern and the value it produced, rather than letting Git reject a name Kotta chose.

## Cancellation path

Adoption itself has nothing to cancel: it creates nothing. A contract started in an adopted checkout
is retired by `cancel` like any other, and the only difference is what survives — the branch and the
checkout, because they were never Kotta's. The claim is released; the environment is left as it was
found.

## Retry and duplicate-action behaviour

- Resolving the control plane is a pure read and repeats freely.
- `start` still refuses a second claim for the same contract, in either mode.
- A `start` that fails after adopting rolls back only the state it wrote — contract file, claim,
  lifecycle event — and never removes a branch or checkout it did not create. The existing rollback
  already distinguishes `createdWorktree`; adoption extends that flag rather than bypassing it.
- Re-running `close` or `cancel` on an adopted contract is refused by state, as today.

## Audit and notification expectations

- The claim records `origin: created | adopted`, and the schema accepts it. The lifecycle event for
  `start` says which mode it used and on which branch, so a reader six months later can tell why no
  worktree was ever made.
- `kotta status` names the control plane it resolved and how — single checkout, or the base-branch
  worktree — because a command that silently picks a different writer than the reader expects is the
  failure this contract exists to prevent.
- `close` and `cancel` report what they left alone in adopted mode, the way `claim release` already
  reports a preserved branch.

## Scope

1. `controlPlaneRoot` (`src/git/control-plane.ts:31-38`) resolves by worktree count first: exactly
   one checkout is the control plane whatever its branch; the linked cases and their refusals are
   unchanged.
2. `readWorkspaceConfig` (`src/core/config.ts`) reads `git.branch_pattern`, and `branchName`
   (`src/commands/contract.ts:19`) renders `{prefix}`, `{id}` and `{slug}` from it instead of the
   hardcoded string. The shipped default produces today's names byte for byte.
3. `startContract` adopts in a single checkout on a non-protected branch: record the branch and the
   checkout, create neither, and mark the claim `origin: adopted`.
4. `origin` on the claim: `schemas/claim.schema.json` (which today also omits the `execution_mode`
   the writer already sets) and `validateClaim` (`src/core/claim.ts`).
5. `closeContract` and `cancelContract` remove a worktree and delete a branch only for
   `origin: created`, and report what they left.
6. `kotta status` names the resolved control plane and its mode.
7. Documentation: the `templates/AGENTS.md` sentence about live state staying on `git.base_branch`
   gains the single-checkout case; README's control-plane paragraph likewise.
8. Tests for every state, transition and refusal above, including the reported reproduction.

## Non-goals

- Writing canonical state to a branch that is not checked out. The alternative was considered and
  rejected in `D-01kztvgb4q8tnhcw4gm2wqrz8b`: it keeps today's strictness at the price of git
  plumbing and a session that cannot read its own state.
- Relaxing the protected-branch rule. A single checkout on `main` is a control plane and never an
  execution target.
- Multi-worktree behaviour of any kind. Those paths keep their present behaviour and their present
  refusals, wording included.
- Migrating repositories that already have a claim recorded against a branch the code is not on.
  There are none here; elsewhere `claim release --force` and a fresh `start` repair it once this
  lands.
- Making the host's branch name conform to `branch_pattern`, or renaming it. The environment's name
  is taken as given.
- Nested batches (`F-01kztt37st3xy3dmfnr23getrn`). Unrelated, and still missing its own intent.

## Acceptance

- In a repository with one checkout on `claude/harness-branch`, `kotta status`, `kotta contract new`,
  `define`, `sign`, `start`, `review` and `close` all succeed, and the reproduction in the measured
  problem no longer errors.
- `start` in that repository creates no branch and no worktree; the contract and the claim both name
  `claude/harness-branch` and the repository root, and the claim records `origin: adopted`.
- `close` on that contract removes no worktree and deletes no branch, and says so.
- `cancel` on that contract likewise leaves branch and checkout in place.
- `start` in a single checkout on `main` refuses, naming the protected branch, while `status` and
  `contract new` in the same checkout succeed.
- With several worktrees and one on the base branch, every existing test passes unchanged.
- With several worktrees and none on the base branch, the present error message is unchanged.
- Setting `git.branch_pattern` to a different pattern changes the branch `start` creates in a
  multi-worktree repository; the shipped default produces the names it produces today.
- A `branch_pattern` that renders to an invalid ref name is refused at `start`, naming the pattern.
- `kotta status` names the resolved control plane and whether it was a single checkout.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- A new integration test reproducing the report exactly: init on `main`, commit, `checkout -b
  claude/harness-branch`, then the full lifecycle through `close`, asserting no second branch
  (`git branch --list` has one entry) and no `.worktrees/` directory.
- A test asserting the claim's `origin` in both modes, and that `close` and `cancel` remove nothing
  in the adopted one.
- A test asserting `start` refuses on a single checkout on `main`, and that `status` there succeeds.
- A test asserting a custom `branch_pattern` changes the created name, and one asserting the default
  reproduces a known name.
- A test asserting the multi-worktree refusals are unchanged, message included.
- `npx vitest run --exclude '.worktrees/**'` — the full suite, which exercises the multi-worktree
  path throughout and is the real regression guard for this change.
- `npm run typecheck` and `npm run build`.

## Constraints

- The single-checkout rule is decided in one place and read by every command. A per-command exception
  is the failure mode the operator named: *"Bárhogy, ahogy konzisztensen működünk."*
- Kotta removes only what Kotta created. Nothing in the host's environment is deleted.
- Multi-worktree behaviour does not change, in either direction. This contract adds a case; it does
  not renegotiate the existing one.
- The protected-branch rule is never weakened.
- The shipped default `branch_pattern` reproduces current branch names exactly, so making the setting
  live is not a silent rename.

## Open decisions

None.

## Execution notes

- `D-01kztvgb4q8tnhcw4gm2wqrz8b` (single checkout is the control plane) and
  `D-01kztv9ysf77134nbqnw28mwg5` (the environment's branch wins when it exists) are the product
  intent for every choice here; read both first.
- The reproduction is three commands and belongs in the test suite as written, not paraphrased.
- `startContract` already tracks `createdWorktree` for its rollback path. `origin` is that same fact
  made durable on the claim rather than a new concept.
- `schemas/claim.schema.json` has `additionalProperties: false` and does not list `execution_mode`,
  which `startContract` writes today — so the schema is already behind its writer, and `validateClaim`
  is the path that actually runs. Fix both while adding `origin`, and say in the review evidence
  whether anything validated the schema before.
- `controlPlaneRoot` is called by `statusCommand` as well as by every mutation, which is why a
  read-only command fails today. Check the fix against a read path, not only a write path.
- `linkedWorktreeEntries` is the existing parser for `git worktree list --porcelain`; the count comes
  from it, not from a second parse.
- The board and `kotta ui` read the same resolution. A single-checkout repository should serve a
  board rather than failing to start one; if that turns out to need more than the resolution change,
  record it rather than widening this contract.
