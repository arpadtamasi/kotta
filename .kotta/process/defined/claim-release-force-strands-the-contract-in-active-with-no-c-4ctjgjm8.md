---
id: T-01m0f27cwtzc2dbgv24ctjgjm8
title: >-
  'claim release --force' strands the contract in active with no command able to
  act on it
status: defined
origin: observation
types:
  - fix
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01kzhnkbpdfc2v4bste7bbdr58
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
