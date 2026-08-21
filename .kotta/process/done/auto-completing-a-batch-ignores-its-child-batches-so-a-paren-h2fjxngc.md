---
id: T-01m0f27fc9ds5y3rm0h2fjxngc
title: >-
  Auto-completing a batch ignores its child batches, so a parent with direct
  contracts can close while children are open
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
  feat/T-01m0f27fc9ds5y3rm0h2fjxngc-auto-completing-a-batch-ignores-its-child-batches-so-a-paren
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01m0f1mqaydrtkx3x2nbck58ke
assigned_agent: claude
worktree: .worktrees/T-01m0f27fc9ds5y3rm0h2fjxngc
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: bfb47c147fdcfd5c55609065efc380cca56f9d15
resolution: completed
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

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A parent batch holding a direct contract and an open child batch stays open when its last direct | Acceptance 1 (a parent with an open child stays open) and 2 (it completes once the whole subtree is done): tests/integration/batch-nesting.test.ts, 'a parent mixing direct contracts with child batches waits for both (F-01m0f1mqaydrtkx3x2nbck58ke)'. It builds a parent holding one direct contract and one child batch that holds another, closes the direct contract, and asserts 'batch status' reports both parent and child still backlog; then closes the child's only contract and asserts the child reads done and the parent reads done with it.  The test was confirmed to be a real regression test, not a passing tautology: with src/commands/contract.ts reverted to main and everything else in place, it fails on the first assertion (the parent had already auto-closed); with the change restored it passes.  Acceptance 3 (the automatic and the explicit path share one implementation): the completeness test now lives once, as openSubtreeMembers in the new src/filesystem/batches.ts. closeBatch calls it for its three refusals; updateContainingBatch calls batchSubtreeComplete, which is that same function. The tree walk — findBatch, batchTree, subtreeContracts — moved to that module so contract.ts can reach it without importing batch.ts, which imports contract.ts. Both paths therefore also read member state the same way, through resolveEffectiveContract; the automatic path previously used findContract, which reports a contract executing in its own worktree as defined.  Beyond the two acceptance cases, the automatic path now reconsiders every open batch carrying the contract anywhere in its subtree, repeating until a pass changes nothing. Without that, acceptance 2 is unreachable: a parent is only visited when one of its own direct contracts closes, so a parent whose child finished last would never complete. A batch reads its children's state from where their files sit, which is why the passes repeat rather than recurse in one go.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. The whole nesting file passes, including the pre-existing 'closes only when every child batch and every contract underneath is done' and 'kotta validate reports a hand-made cycle'. npm run typecheck clean. Commit b82dfff. |
| The same parent auto-closes once every contract in its subtree is `done`. | Acceptance 1 (a parent with an open child stays open) and 2 (it completes once the whole subtree is done): tests/integration/batch-nesting.test.ts, 'a parent mixing direct contracts with child batches waits for both (F-01m0f1mqaydrtkx3x2nbck58ke)'. It builds a parent holding one direct contract and one child batch that holds another, closes the direct contract, and asserts 'batch status' reports both parent and child still backlog; then closes the child's only contract and asserts the child reads done and the parent reads done with it.  The test was confirmed to be a real regression test, not a passing tautology: with src/commands/contract.ts reverted to main and everything else in place, it fails on the first assertion (the parent had already auto-closed); with the change restored it passes.  Acceptance 3 (the automatic and the explicit path share one implementation): the completeness test now lives once, as openSubtreeMembers in the new src/filesystem/batches.ts. closeBatch calls it for its three refusals; updateContainingBatch calls batchSubtreeComplete, which is that same function. The tree walk — findBatch, batchTree, subtreeContracts — moved to that module so contract.ts can reach it without importing batch.ts, which imports contract.ts. Both paths therefore also read member state the same way, through resolveEffectiveContract; the automatic path previously used findContract, which reports a contract executing in its own worktree as defined.  Beyond the two acceptance cases, the automatic path now reconsiders every open batch carrying the contract anywhere in its subtree, repeating until a pass changes nothing. Without that, acceptance 2 is unreachable: a parent is only visited when one of its own direct contracts closes, so a parent whose child finished last would never complete. A batch reads its children's state from where their files sit, which is why the passes repeat rather than recurse in one go.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. The whole nesting file passes, including the pre-existing 'closes only when every child batch and every contract underneath is done' and 'kotta validate reports a hand-made cycle'. npm run typecheck clean. Commit b82dfff. |
| The automatic path and `batch close` agree on completeness for every membership shape, and share | Acceptance 1 (a parent with an open child stays open) and 2 (it completes once the whole subtree is done): tests/integration/batch-nesting.test.ts, 'a parent mixing direct contracts with child batches waits for both (F-01m0f1mqaydrtkx3x2nbck58ke)'. It builds a parent holding one direct contract and one child batch that holds another, closes the direct contract, and asserts 'batch status' reports both parent and child still backlog; then closes the child's only contract and asserts the child reads done and the parent reads done with it.  The test was confirmed to be a real regression test, not a passing tautology: with src/commands/contract.ts reverted to main and everything else in place, it fails on the first assertion (the parent had already auto-closed); with the change restored it passes.  Acceptance 3 (the automatic and the explicit path share one implementation): the completeness test now lives once, as openSubtreeMembers in the new src/filesystem/batches.ts. closeBatch calls it for its three refusals; updateContainingBatch calls batchSubtreeComplete, which is that same function. The tree walk — findBatch, batchTree, subtreeContracts — moved to that module so contract.ts can reach it without importing batch.ts, which imports contract.ts. Both paths therefore also read member state the same way, through resolveEffectiveContract; the automatic path previously used findContract, which reports a contract executing in its own worktree as defined.  Beyond the two acceptance cases, the automatic path now reconsiders every open batch carrying the contract anywhere in its subtree, repeating until a pass changes nothing. Without that, acceptance 2 is unreachable: a parent is only visited when one of its own direct contracts closes, so a parent whose child finished last would never complete. A batch reads its children's state from where their files sit, which is why the passes repeat rather than recurse in one go.  Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. The whole nesting file passes, including the pre-existing 'closes only when every child batch and every contract underneath is done' and 'kotta validate reports a hand-made cycle'. npm run typecheck clean. Commit b82dfff. |

### Verification performed

Acceptance 1 (a parent with an open child stays open) and 2 (it completes once the whole subtree is done): tests/integration/batch-nesting.test.ts, 'a parent mixing direct contracts with child batches waits for both (F-01m0f1mqaydrtkx3x2nbck58ke)'. It builds a parent holding one direct contract and one child batch that holds another, closes the direct contract, and asserts 'batch status' reports both parent and child still backlog; then closes the child's only contract and asserts the child reads done and the parent reads done with it.

The test was confirmed to be a real regression test, not a passing tautology: with src/commands/contract.ts reverted to main and everything else in place, it fails on the first assertion (the parent had already auto-closed); with the change restored it passes.

Acceptance 3 (the automatic and the explicit path share one implementation): the completeness test now lives once, as openSubtreeMembers in the new src/filesystem/batches.ts. closeBatch calls it for its three refusals; updateContainingBatch calls batchSubtreeComplete, which is that same function. The tree walk — findBatch, batchTree, subtreeContracts — moved to that module so contract.ts can reach it without importing batch.ts, which imports contract.ts. Both paths therefore also read member state the same way, through resolveEffectiveContract; the automatic path previously used findContract, which reports a contract executing in its own worktree as defined.

Beyond the two acceptance cases, the automatic path now reconsiders every open batch carrying the contract anywhere in its subtree, repeating until a pass changes nothing. Without that, acceptance 2 is unreachable: a parent is only visited when one of its own direct contracts closes, so a parent whose child finished last would never complete. A batch reads its children's state from where their files sit, which is why the passes repeat rather than recurse in one go.

Suite: npm test on a serial run — 47 test files, 328 passed, 1 skipped, exit 0. The whole nesting file passes, including the pre-existing 'closes only when every child batch and every contract underneath is done' and 'kotta validate reports a hand-made cycle'. npm run typecheck clean. Commit b82dfff.

### Deviations

The change is wider than 'the completeness test it applies': the automatic path also walks up the tree. Acceptance 2 cannot hold without it, so it is inside the outcome even though the scope named only the test.

### Observations created

None.

### Known concerns

updateContainingBatch now calls batchTree, which throws on cyclic nesting. A workspace with a hand-made cycle would fail while closing a contract, where before it did not. Such a workspace is already invalid and kotta validate names the cycle, so this surfaces the corruption rather than adding one.
