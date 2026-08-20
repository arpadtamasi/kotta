---
id: T-01m0f27cwtzc2dbgv24ctjgjm8
title: >-
  'claim release --force' strands the contract in active with no command able to
  act on it
status: review
origin: observation
types:
  - fix
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01m0f27cwtzc2dbgv24ctjgjm8-claim-release-force-strands-the-contract-in-active-with-no-c
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01kzhnkbpdfc2v4bste7bbdr58
assigned_agent: claude
worktree: .worktrees/T-01m0f27cwtzc2dbgv24ctjgjm8
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 12faa64e9d1e251a8759956e6be8a5f03d2a1c4e
---
## Outcome

`claim release --force` leaves the contract in a state a command can act on. Releasing a claim is
the documented inverse of `contract start`: start moves a contract from `defined` to `active` and
writes the claim, so release deletes the claim and returns the contract to `defined`. After a
release the contract can be started or executed again without anyone hand-editing frontmatter.

## Scope

`releaseClaim` in `src/commands/claim.ts`: within the same control-plane mutation that deletes the
claim file, move the contract's record back to `defined` and record the transition as a lifecycle
event, so the claim deletion and the state change land in one commit. Whatever `contract start`
needs in order to accept a contract whose branch and worktree already exist, since release
deliberately preserves both.

## Non-goals

Deleting or rewinding the branch or the execution worktree — release preserves them by design, and
that stays true. Changing what `--force` means, or letting a release run without it. Touching
`reopen`, `cancel`, or any other lifecycle exit.

## Acceptance

- After `kotta claim release <id> --force`, the contract's status is `defined` and no claim file
  remains for it.
- A contract that has been through a release is accepted by `kotta contract start` and by
  `kotta contract execute`, rather than being refused for being in the wrong state.
- The claim deletion and the contract's return to `defined` are one commit on the control plane;
  no intermediate commit shows a contract that is `active` with no claim.
- A contract whose branch already exists from the released run is started without a git error.

## Verification

- A new integration test releases a claim on a started contract and asserts the contract's state,
  the absence of the claim file, and that `contract start` accepts it afterwards.
- `npm test` passes.

## Constraints

The control plane is the only writer of lifecycle state; the change goes through
`withControlPlaneMutation` and `commitControlState` like every other transition.

## Open decisions

None.

## Execution notes

Reported as F-01kzhnsncw8znqdn14rf5d4tfp's sibling F-01kzhnkbpdfc2v4bste7bbdr58, and hit in
ezchops/oneanda on contract T-01kzhdb2s5ehvycvr1hdwgmw60, where the only observed exit was
hand-editing `status: active` back to `defined`, which the rules forbid.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| After `kotta claim release <id> --force`, the contract's status is `defined` and no claim file | Acceptance 1 (defined again, no claim left), 2 (start and execute accept it), 3 (one commit) and 4 (an existing branch does not refuse the start) are all carried by one new integration test: tests/integration/contract-execute.test.ts, 'releasing a claim returns the contract to defined, so start and execute accept it again (F-01kzhnkbpdfc2v4bste7bbdr58)'.  It starts a contract, releases the claim from the execution worktree, then asserts in order: 'contract validate' reports state defined and no claim file exists (1); HEAD's name-only file list contains both the deleted .kotta/process/claims/<id>.yaml and a path under .kotta/process/defined/, and 'git status --porcelain' is empty, so the deletion and the return are one commit with no intermediate state (3); the preserved branch still exists and a second 'contract start' returns the same branch and worktree instead of failing with 'Branch already exists' (4); and after a second release, 'contract execute' with the agent double reaches the agent and reports state implemented on that same branch (2).  The whole file passes: 24 tests, including the pre-existing 'claim recovery checks the recorded execution worktree and commits canonical state', the three 'start rolls back cleanly when it fails' cases and 'an interrupt leaves the claim and worktree in place'.  Design: release returns the contract to defined, chosen in conversation over a separate command and over extending reopen. The branch and worktree stay on the record because release preserves them on disk, and start reuses exactly the pair the contract records — a branch of the same name that the contract does not record still refuses, so an unrelated collision is unaffected. No new vocabulary was added: the claim keeps origin 'created' and the contract keeps branch_origin 'created', because Kotta did make that branch and worktree, and close and cancel must still remove them. The lifecycle event names the reuse instead.  Suite: npm test — 46 of 47 test files pass, 327 passed, 1 skipped. The one failure is tests/integration/ui-port.test.ts, 'exhausting the retry bound explains how to supply an explicit port', which passes on its own immediately afterwards (12 tests) and is unrelated to this change: a 'kotta ui' server is listening on 127.0.0.1:4311 on this machine, which is the port range those tests assume free. npm run typecheck clean. Commit 64bec97. |
| A contract that has been through a release is accepted by `kotta contract start` and by | Acceptance 1 (defined again, no claim left), 2 (start and execute accept it), 3 (one commit) and 4 (an existing branch does not refuse the start) are all carried by one new integration test: tests/integration/contract-execute.test.ts, 'releasing a claim returns the contract to defined, so start and execute accept it again (F-01kzhnkbpdfc2v4bste7bbdr58)'.  It starts a contract, releases the claim from the execution worktree, then asserts in order: 'contract validate' reports state defined and no claim file exists (1); HEAD's name-only file list contains both the deleted .kotta/process/claims/<id>.yaml and a path under .kotta/process/defined/, and 'git status --porcelain' is empty, so the deletion and the return are one commit with no intermediate state (3); the preserved branch still exists and a second 'contract start' returns the same branch and worktree instead of failing with 'Branch already exists' (4); and after a second release, 'contract execute' with the agent double reaches the agent and reports state implemented on that same branch (2).  The whole file passes: 24 tests, including the pre-existing 'claim recovery checks the recorded execution worktree and commits canonical state', the three 'start rolls back cleanly when it fails' cases and 'an interrupt leaves the claim and worktree in place'.  Design: release returns the contract to defined, chosen in conversation over a separate command and over extending reopen. The branch and worktree stay on the record because release preserves them on disk, and start reuses exactly the pair the contract records — a branch of the same name that the contract does not record still refuses, so an unrelated collision is unaffected. No new vocabulary was added: the claim keeps origin 'created' and the contract keeps branch_origin 'created', because Kotta did make that branch and worktree, and close and cancel must still remove them. The lifecycle event names the reuse instead.  Suite: npm test — 46 of 47 test files pass, 327 passed, 1 skipped. The one failure is tests/integration/ui-port.test.ts, 'exhausting the retry bound explains how to supply an explicit port', which passes on its own immediately afterwards (12 tests) and is unrelated to this change: a 'kotta ui' server is listening on 127.0.0.1:4311 on this machine, which is the port range those tests assume free. npm run typecheck clean. Commit 64bec97. |
| The claim deletion and the contract's return to `defined` are one commit on the control plane; | Acceptance 1 (defined again, no claim left), 2 (start and execute accept it), 3 (one commit) and 4 (an existing branch does not refuse the start) are all carried by one new integration test: tests/integration/contract-execute.test.ts, 'releasing a claim returns the contract to defined, so start and execute accept it again (F-01kzhnkbpdfc2v4bste7bbdr58)'.  It starts a contract, releases the claim from the execution worktree, then asserts in order: 'contract validate' reports state defined and no claim file exists (1); HEAD's name-only file list contains both the deleted .kotta/process/claims/<id>.yaml and a path under .kotta/process/defined/, and 'git status --porcelain' is empty, so the deletion and the return are one commit with no intermediate state (3); the preserved branch still exists and a second 'contract start' returns the same branch and worktree instead of failing with 'Branch already exists' (4); and after a second release, 'contract execute' with the agent double reaches the agent and reports state implemented on that same branch (2).  The whole file passes: 24 tests, including the pre-existing 'claim recovery checks the recorded execution worktree and commits canonical state', the three 'start rolls back cleanly when it fails' cases and 'an interrupt leaves the claim and worktree in place'.  Design: release returns the contract to defined, chosen in conversation over a separate command and over extending reopen. The branch and worktree stay on the record because release preserves them on disk, and start reuses exactly the pair the contract records — a branch of the same name that the contract does not record still refuses, so an unrelated collision is unaffected. No new vocabulary was added: the claim keeps origin 'created' and the contract keeps branch_origin 'created', because Kotta did make that branch and worktree, and close and cancel must still remove them. The lifecycle event names the reuse instead.  Suite: npm test — 46 of 47 test files pass, 327 passed, 1 skipped. The one failure is tests/integration/ui-port.test.ts, 'exhausting the retry bound explains how to supply an explicit port', which passes on its own immediately afterwards (12 tests) and is unrelated to this change: a 'kotta ui' server is listening on 127.0.0.1:4311 on this machine, which is the port range those tests assume free. npm run typecheck clean. Commit 64bec97. |
| A contract whose branch already exists from the released run is started without a git error. | Acceptance 1 (defined again, no claim left), 2 (start and execute accept it), 3 (one commit) and 4 (an existing branch does not refuse the start) are all carried by one new integration test: tests/integration/contract-execute.test.ts, 'releasing a claim returns the contract to defined, so start and execute accept it again (F-01kzhnkbpdfc2v4bste7bbdr58)'.  It starts a contract, releases the claim from the execution worktree, then asserts in order: 'contract validate' reports state defined and no claim file exists (1); HEAD's name-only file list contains both the deleted .kotta/process/claims/<id>.yaml and a path under .kotta/process/defined/, and 'git status --porcelain' is empty, so the deletion and the return are one commit with no intermediate state (3); the preserved branch still exists and a second 'contract start' returns the same branch and worktree instead of failing with 'Branch already exists' (4); and after a second release, 'contract execute' with the agent double reaches the agent and reports state implemented on that same branch (2).  The whole file passes: 24 tests, including the pre-existing 'claim recovery checks the recorded execution worktree and commits canonical state', the three 'start rolls back cleanly when it fails' cases and 'an interrupt leaves the claim and worktree in place'.  Design: release returns the contract to defined, chosen in conversation over a separate command and over extending reopen. The branch and worktree stay on the record because release preserves them on disk, and start reuses exactly the pair the contract records — a branch of the same name that the contract does not record still refuses, so an unrelated collision is unaffected. No new vocabulary was added: the claim keeps origin 'created' and the contract keeps branch_origin 'created', because Kotta did make that branch and worktree, and close and cancel must still remove them. The lifecycle event names the reuse instead.  Suite: npm test — 46 of 47 test files pass, 327 passed, 1 skipped. The one failure is tests/integration/ui-port.test.ts, 'exhausting the retry bound explains how to supply an explicit port', which passes on its own immediately afterwards (12 tests) and is unrelated to this change: a 'kotta ui' server is listening on 127.0.0.1:4311 on this machine, which is the port range those tests assume free. npm run typecheck clean. Commit 64bec97. |

### Verification performed

Acceptance 1 (defined again, no claim left), 2 (start and execute accept it), 3 (one commit) and 4 (an existing branch does not refuse the start) are all carried by one new integration test: tests/integration/contract-execute.test.ts, 'releasing a claim returns the contract to defined, so start and execute accept it again (F-01kzhnkbpdfc2v4bste7bbdr58)'.

It starts a contract, releases the claim from the execution worktree, then asserts in order: 'contract validate' reports state defined and no claim file exists (1); HEAD's name-only file list contains both the deleted .kotta/process/claims/<id>.yaml and a path under .kotta/process/defined/, and 'git status --porcelain' is empty, so the deletion and the return are one commit with no intermediate state (3); the preserved branch still exists and a second 'contract start' returns the same branch and worktree instead of failing with 'Branch already exists' (4); and after a second release, 'contract execute' with the agent double reaches the agent and reports state implemented on that same branch (2).

The whole file passes: 24 tests, including the pre-existing 'claim recovery checks the recorded execution worktree and commits canonical state', the three 'start rolls back cleanly when it fails' cases and 'an interrupt leaves the claim and worktree in place'.

Design: release returns the contract to defined, chosen in conversation over a separate command and over extending reopen. The branch and worktree stay on the record because release preserves them on disk, and start reuses exactly the pair the contract records — a branch of the same name that the contract does not record still refuses, so an unrelated collision is unaffected. No new vocabulary was added: the claim keeps origin 'created' and the contract keeps branch_origin 'created', because Kotta did make that branch and worktree, and close and cancel must still remove them. The lifecycle event names the reuse instead.

Suite: npm test — 46 of 47 test files pass, 327 passed, 1 skipped. The one failure is tests/integration/ui-port.test.ts, 'exhausting the retry bound explains how to supply an explicit port', which passes on its own immediately afterwards (12 tests) and is unrelated to this change: a 'kotta ui' server is listening on 127.0.0.1:4311 on this machine, which is the port range those tests assume free. npm run typecheck clean. Commit 64bec97.

### Deviations

None.

### Observations created

None beyond F-01m0f521m0j5f0we3hb316tnhj, already recorded under T-01m0f27ebnwvrqgbx44rarvy6y.

### Known concerns

The full-suite run was not clean: ui-port.test.ts failed in it and passed standalone. Its flakiness is already reported as F-01kz1pyenv49cygqcwhqqt57nj, and a live kotta ui server on port 4311 makes it worse here, so a reviewer should not read that failure as evidence about this change.
