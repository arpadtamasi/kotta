---
id: T-01m0f27fc9ds5y3rm0h2fjxngc
title: >-
  Auto-completing a batch ignores its child batches, so a parent with direct
  contracts can close while children are open
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
source_observation: F-01m0f1mqaydrtkx3x2nbck58ke
---
## Outcome

A batch closes on the same condition however it is closed. The automatic path that fires when a
contract reaches `done` judges the batch's whole subtree — its child batches and their contracts —
exactly as the explicit `batch close` does, so a parent can never report done while work under it
is still open.

## Scope

`updateContainingBatch` in `src/commands/contract.ts`: the completeness test it applies before
marking a containing batch done, which today reads only the batch's `contracts` array. The subtree
test `closeBatch` already uses in `src/commands/batch.ts`, which is the behaviour to converge on
rather than duplicate.

## Non-goals

Changing what membership a batch may hold — a batch keeps its mix of direct contracts and child
batches. Changing `batch close`, whose subtree check is already correct. Revisiting batches already
marked done.

## Acceptance

- A parent batch holding a direct contract and an open child batch stays open when its last direct
  contract reaches `done`.
- The same parent auto-closes once every contract in its subtree is `done`.
- The automatic path and `batch close` agree on completeness for every membership shape, and share
  one implementation of the test rather than two.

## Verification

- A new integration test builds a parent with one direct contract and one open child batch, closes
  the direct contract, and asserts the parent is still open; then closes the child's contracts and
  asserts the parent completes.
- `npm test` passes.

## Constraints

None beyond the existing control-plane mutation and commit discipline.

## Open decisions

None.

## Execution notes

Reported as F-01m0f1mqaydrtkx3x2nbck58ke on 2026-08-20 while auditing the spec nodes against main.
Nested batches are grouping only, so a parent that lies about being done is the only signal a
reader has that the group is finished.
