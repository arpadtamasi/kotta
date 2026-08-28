---
id: T-01m13p40gan8r94m8byw9zb522
title: A batch releases its first wave without accusing the operator
status: defined
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0f0wn89r5np2yce79y2pctq
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
branch: null
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'Every batch mutation commits the canonical state it wrote, so the workspace is as clean after it as before, and a second identical command is a no-op rather than a refusal.':
    - BR-01m0f0wn89r5np2yce79y2pctq
  'A batch releases its first wave on its first invocation, from a workspace that was clean when the operator invoked it.':
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
  'No refusal blames the operator for a change Kotta made: a dirty-tree refusal names changes the operator can actually see and account for.':
    - BR-01m0f0wn89r5np2yce79y2pctq
---
# T-01m13p40gan8r94m8byw9zb522 — A batch releases its first wave without accusing the operator

## Outcome

`kotta batch start` releases its first wave on the first invocation. Today it refuses with
*"Repository is dirty. Commit or remove pending changes before starting a task."* from a workspace
`git status --porcelain` reports as empty, and the identical command succeeds on the second run.

The root is one line of ordering and a missing commit. `startBatch` calls `validateBatch` before
`assertClean`; a batch still in `backlog` is promoted to `defined` there, which writes the batch
file, regenerates the index and appends a lifecycle event — and, unlike every task mutation, does
not commit. `assertClean` then finds exactly those three changes and blames the operator for them.

It is not confined to start. `batch.ts` calls `commitControlState` once; `task.ts` calls it six
times and `observation.ts` four. Measured on a clean fixture: `batch new` leaves
`process/batches/` untracked, and `batch add` leaves the member task modified.

## Scope

- The batch mutations that write canonical state and do not commit it: new, add, remove, the
  `defined` promotion inside validate, close, finalize.
- The refusal itself, where a service reports a checkout as dirty.

## Non-goals

- The wave rules, the coordinator branch handling and finalize's safety checks, all unchanged.
- The task and observation families, which already commit.
- Making `validate` write less: promoting a validated batch to `defined` is the documented
  behaviour, and it stays; it just has to record what it did.

## Acceptance

- Every batch mutation commits the canonical state it wrote, so the workspace is as clean after it as before, and a second identical command is a no-op rather than a refusal.
- A batch releases its first wave on its first invocation, from a workspace that was clean when the operator invoked it.
- No refusal blames the operator for a change Kotta made: a dirty-tree refusal names changes the operator can actually see and account for.

## Verification

- run: npx vitest run tests/integration/batch-control-state.test.ts
- run: npx vitest run tests/integration/batch.test.ts tests/integration/batch-nesting.test.ts tests/integration/batch-coordinator.test.ts tests/integration/batch-dependency-waves.test.ts tests/integration/batch-waves-budget.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- A commit per mutation, not a commit at the end of a session: the point is that the workspace is
  clean when the next command reads it.
- The batch-waves budget fixture works around this defect today by committing residue between
  releases; that workaround comes out with the defect.

## Open decisions

None.

## Execution notes

Found on 2026-08-26 while testing the parallelism budget, reproduced on `main` unchanged, and
recorded as F-01m0zn0d24hjbva47xdp1kb6m1 before this task existed.
