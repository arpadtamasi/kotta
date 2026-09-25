---
id: T-01m0f27ebnwvrqgbx44rarvy6y
title: >-
  'observation new' without --discovered-during writes without committing and
  blocks the next command
status: done
origin: observation
types:
  - fix
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01m0f27ebnwvrqgbx44rarvy6y-observation-new-without-discovered-during-writes-without-com
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01kzhjhsknj52aqr4mxfkbpp0q
assigned_agent: claude
worktree: .worktrees/T-01m0f27ebnwvrqgbx44rarvy6y
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 1938f571639d71d0f6353bb6f763db9afe9825a2
resolution: completed
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

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| After `kotta observation new` without `--discovered-during`, the control worktree reports no | Acceptance 1 (no pending changes after a standalone capture) and 2 (the next command is not refused): tests/integration/observation.test.ts, 'is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)'. From a committed baseline it runs 'observation new' without --discovered-during, asserts 'git status --porcelain' is empty, and then runs 'contract cancel', which takes the strict control-plane mutation and is one of the two commands the report saw fail. Before the fix that cancel failed with 'Repository is dirty'.  Acceptance 3 (one commit carries the file and the index): the same test asserts the subject of HEAD is 'chore(kotta): capture <id>' and that HEAD's name-only file list is exactly the observation file plus .kotta/process/index.md.  Constraint (the attributed path is unchanged): its branch keeps its lifecycle event, its commit message and its strict mutation; the diff adds a second branch rather than altering the first. The pre-existing test 'keeps a observation separate until a human resolves it into backlog work' still passes unchanged.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. npm run typecheck clean. Commit 4d215ed.  Deviation from the definition: the standalone path uses requireClean: false rather than the strict default. The first attempt used the default and refused to record an observation whenever the tree was dirty, which is fatal where a single checkout is also the control plane — the case the observation is usually about. 'observation resolve' and 'contract sign' already take the same lenient mutation, and commitControlState stages only the workspace directory, so no code change is swept in. |
| A lifecycle command run immediately after such an `observation new` succeeds, rather than | Acceptance 1 (no pending changes after a standalone capture) and 2 (the next command is not refused): tests/integration/observation.test.ts, 'is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)'. From a committed baseline it runs 'observation new' without --discovered-during, asserts 'git status --porcelain' is empty, and then runs 'contract cancel', which takes the strict control-plane mutation and is one of the two commands the report saw fail. Before the fix that cancel failed with 'Repository is dirty'.  Acceptance 3 (one commit carries the file and the index): the same test asserts the subject of HEAD is 'chore(kotta): capture <id>' and that HEAD's name-only file list is exactly the observation file plus .kotta/process/index.md.  Constraint (the attributed path is unchanged): its branch keeps its lifecycle event, its commit message and its strict mutation; the diff adds a second branch rather than altering the first. The pre-existing test 'keeps a observation separate until a human resolves it into backlog work' still passes unchanged.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. npm run typecheck clean. Commit 4d215ed.  Deviation from the definition: the standalone path uses requireClean: false rather than the strict default. The first attempt used the default and refused to record an observation whenever the tree was dirty, which is fatal where a single checkout is also the control plane — the case the observation is usually about. 'observation resolve' and 'contract sign' already take the same lenient mutation, and commitControlState stages only the workspace directory, so no code change is swept in. |
| The observation file and the updated index land in one commit. | Acceptance 1 (no pending changes after a standalone capture) and 2 (the next command is not refused): tests/integration/observation.test.ts, 'is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)'. From a committed baseline it runs 'observation new' without --discovered-during, asserts 'git status --porcelain' is empty, and then runs 'contract cancel', which takes the strict control-plane mutation and is one of the two commands the report saw fail. Before the fix that cancel failed with 'Repository is dirty'.  Acceptance 3 (one commit carries the file and the index): the same test asserts the subject of HEAD is 'chore(kotta): capture <id>' and that HEAD's name-only file list is exactly the observation file plus .kotta/process/index.md.  Constraint (the attributed path is unchanged): its branch keeps its lifecycle event, its commit message and its strict mutation; the diff adds a second branch rather than altering the first. The pre-existing test 'keeps a observation separate until a human resolves it into backlog work' still passes unchanged.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. npm run typecheck clean. Commit 4d215ed.  Deviation from the definition: the standalone path uses requireClean: false rather than the strict default. The first attempt used the default and refused to record an observation whenever the tree was dirty, which is fatal where a single checkout is also the control plane — the case the observation is usually about. 'observation resolve' and 'contract sign' already take the same lenient mutation, and commitControlState stages only the workspace directory, so no code change is swept in. |

### Verification performed

Acceptance 1 (no pending changes after a standalone capture) and 2 (the next command is not refused): tests/integration/observation.test.ts, 'is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)'. From a committed baseline it runs 'observation new' without --discovered-during, asserts 'git status --porcelain' is empty, and then runs 'contract cancel', which takes the strict control-plane mutation and is one of the two commands the report saw fail. Before the fix that cancel failed with 'Repository is dirty'.

Acceptance 3 (one commit carries the file and the index): the same test asserts the subject of HEAD is 'chore(kotta): capture <id>' and that HEAD's name-only file list is exactly the observation file plus .kotta/process/index.md.

Constraint (the attributed path is unchanged): its branch keeps its lifecycle event, its commit message and its strict mutation; the diff adds a second branch rather than altering the first. The pre-existing test 'keeps a observation separate until a human resolves it into backlog work' still passes unchanged.

Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. npm run typecheck clean. Commit 4d215ed.

Deviation from the definition: the standalone path uses requireClean: false rather than the strict default. The first attempt used the default and refused to record an observation whenever the tree was dirty, which is fatal where a single checkout is also the control plane — the case the observation is usually about. 'observation resolve' and 'contract sign' already take the same lenient mutation, and commitControlState stages only the workspace directory, so no code change is swept in.

### Deviations

The standalone path tolerates a dirty tree (requireClean: false) instead of requiring a clean one. Recorded above with the reason; it keeps 'observation new' usable in a single-checkout workspace, and matches what 'observation resolve' and 'contract sign' already do.

### Observations created

F-01m0f521m0j5f0we3hb316tnhj — tests/integration/batch-coordinator.test.ts fails non-deterministically, on a different test each time. Hit while verifying this contract; a re-run cleared it.

### Known concerns

resolveObservation still passes requireClean: false explicitly to tolerate the dirt this command used to leave. That accommodation is now unnecessary for this cause, but removing it is outside this contract's scope.
