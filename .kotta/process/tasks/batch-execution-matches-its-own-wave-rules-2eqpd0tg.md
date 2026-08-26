---
id: T-01m0jdntvbbp5rbj6t2eqpd0tg
title: Batch execution matches its own wave rules
status: active
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
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-26'
coverage:
  'A batch never holds more members at once than its configured parallelism: with nothing finished in between, a second release starts nothing and reports the budget as the reason.':
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
  A member the batch is already running is reported as running. Only a member the batch has not released is reported as waiting.:
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  'Which member is eligible does not change: the dependency rules and the sequential mode still decide the same set, and a batch whose members are all done still says so.':
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
  'A release with no budget left changes nothing — no claim, no branch, no worktree, no lifecycle event for a member it did not start.':
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: a5ea9e550268d54052c22a4a91e29239988beb74
---
# T-01m0jdntvbbp5rbj6t2eqpd0tg — Batch execution matches its own wave rules

## Outcome

A running batch never holds more tasks than its configured parallelism, and its report never
describes a running task as waiting. Measured on 2026-08-26 against `main` at `759fcca`, with four
independent defined tasks and `--parallelism 2`, neither held:

```
--- first batch start ---
Started T-…d4mwqc, Started T-…jck4q5
Waiting: T-…xgwhjd, T-…12kptf
active after 1st: 2                       correct

--- second batch start, nothing finished in between ---
Started T-…xgwhjd, Started T-…12kptf
Waiting: T-…d4mwqc, T-…jck4q5
active after 2nd: 4   (claims: 4)         four, under a batch configured for two
```

Two findings, one root, in `src/commands/batch.ts:284`. The cap is applied to the members whose
effective state is `defined`; members already active were filtered out above it and so never count
against it. Each invocation may therefore start a further full wave. The same run then reports the
two it left running as `Waiting:` — the report calls active work waiting, the opposite of what a
reader needs from it.

## Scope

- The wave release in `src/commands/batch.ts`: what counts against `execution.parallelism`.
- What `batch start` returns and prints about members it did not release this time.

## Non-goals

- Which member is *eligible*. Done, or in review with Git proving its branch reached the
  coordinator, is correct and covered by `tests/integration/batch-dependency-waves.test.ts`; only
  how many of the eligible are released is wrong.
- Coordinator branch handling, finalize, nesting, and `stop_on_failure`, which has no test either
  but is not this task.
- Running the agents themselves: releasing a wave is creating claims, branches and worktrees.

## Acceptance

- A batch never holds more members at once than its configured parallelism: with nothing finished in between, a second release starts nothing and reports the budget as the reason.
- A member the batch is already running is reported as running. Only a member the batch has not released is reported as waiting.
- Which member is eligible does not change: the dependency rules and the sequential mode still decide the same set, and a batch whose members are all done still says so.
- A release with no budget left changes nothing — no claim, no branch, no worktree, no lifecycle event for a member it did not start.

## Verification

- run: npx vitest run tests/integration/batch-waves-budget.test.ts
- run: npx vitest run tests/integration/batch.test.ts tests/integration/batch-dependency-waves.test.ts tests/integration/batch-nesting.test.ts tests/integration/batch-coordinator.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The budget is read from the same effective state the eligibility filter reads, so a member cannot
  be invisible to one and visible to the other.
- A batch configured for one still releases one; the floor is the configured value, not zero.

## Open decisions

- Is `parallelism` a bound on how many members run at once, or on how many one release may start?
  Settled by D-01m0zhkpw7v7pq322pg5nycf1d: it bounds how many run at once, so the measurement above
  is a defect and this task is a fix, not an amendment.

## Execution notes

The decision landed in `Run a batch` before this was defined, so the use case now states the bound
and the reporting rule the code has to keep.
