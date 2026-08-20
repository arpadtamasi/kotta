---
id: T-01m0f27ebnwvrqgbx44rarvy6y
title: >-
  'observation new' without --discovered-during writes without committing and
  blocks the next command
status: defined
origin: observation
types:
  - fix
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01kzhjhsknj52aqr4mxfkbpp0q
---
## Outcome

`kotta observation new` leaves the control plane clean whether or not `--discovered-during` was
given. Kotta's own write never blocks Kotta's next command, and nobody has to hand-run `git commit`
on state files the tool owns.

## Scope

`newObservation` in `src/commands/observation.ts`: the standalone path — the one taken without
`--discovered-during` — runs inside the same control-plane mutation as the attributed path and
commits the new observation file together with the regenerated index.

## Non-goals

Requiring `--discovered-during`, or inventing a contract to attribute a standalone observation to.
A standalone observation legitimately has no contract, so it records no `discovered_during`
lifecycle event; only the commit is at stake.

## Acceptance

- After `kotta observation new` without `--discovered-during`, the control worktree reports no
  pending changes.
- A lifecycle command run immediately after such an `observation new` succeeds, rather than
  refusing with "Repository is dirty".
- The observation file and the updated index land in one commit.

## Verification

- A new integration test runs `observation new` without `--discovered-during`, asserts the control
  worktree is clean, and then runs a lifecycle command that would refuse a dirty repository.
- `npm test` passes.

## Constraints

The attributed path keeps its lifecycle event and its existing commit message; only the standalone
path changes.

## Open decisions

None.

## Execution notes

Reported as F-01kzhjhsknj52aqr4mxfkbpp0q, observed on 2026-08-08 in this repository: `contract
cancel` and `contract reopen` both failed with "Repository is dirty. Commit or remove pending
changes before starting a contract." immediately after a successful `observation new`.
