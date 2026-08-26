---
id: T-01m0jdntvbbp5rbj6t2eqpd0tg
title: Batch execution matches its own wave rules
status: backlog
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec: []
branch: null
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-26'
---
# T-01m0jdntvbbp5rbj6t2eqpd0tg — Batch execution matches its own wave rules

## Outcome

A running batch never holds more tasks than its configured parallelism, and its report never
describes a running task as waiting. The title is accurate today: measured on 2026-08-26, neither
holds.

## Scope

- The wave release in `src/commands/batch.ts:276-305`: what counts against `execution.parallelism`.
- What `batch start` prints and returns about members it did not release this time.

## Non-goals

- The dependency rules themselves. Which member is *eligible* — done, or in review with Git proving
  its branch reached the coordinator — is correct and covered by
  `tests/integration/batch-dependency-waves.test.ts`; only how many of the eligible are released is
  wrong.
- Coordinator branch handling, finalize, nesting and stop-on-failure semantics.
- Running the agents themselves: releasing a wave is creating claims, branches and worktrees.

## Acceptance

- Define an observable condition.

## Verification

- Explain how acceptance will be checked.

## Constraints

None.

## Open decisions

- Is `parallelism` a bound on how many members run at once, or on how many one release may start?
  The use case says the batch "releases the first wave within the configured parallelism", which
  reads as the first; the code implements the second. The measurement below is a defect under the
  first reading and correct behaviour under the second, so the reading decides whether this is a
  fix or an amendment.

## Execution notes

Measured on 2026-08-26 against `main` at `759fcca`, with a fixture batch of four independent
defined tasks and `--parallelism 2`:

```
--- first batch start ---
Started T-…d4mwqc, Started T-…jck4q5
Waiting: T-…xgwhjd, T-…12kptf
active after 1st: 2

--- second batch start (nothing finished in between) ---
Started T-…xgwhjd, Started T-…12kptf
Waiting: T-…d4mwqc, T-…jck4q5
active after 2nd: 4        (claims: 4)
```

Two findings, one root:

1. `batch.ts:284` caps `executable` — the tasks whose effective state is `defined` — at
   `parallelism`. Tasks already active are excluded from that list by the filter above it, so they
   are never counted against the cap. Each invocation may therefore start a further full wave, and
   nothing finished in between. Four claims, four branches and four worktrees under a batch
   configured for two.
2. The same run reports the two tasks it just left running as `Waiting:` — the report calls active
   work waiting, which is the opposite of what a reader needs from it.

`tests/integration/batch.test.ts:25-30` asserts only that `--parallelism 1` is *stored*; no test
exercises the cap. `stop_on_failure` (`batch.ts:299`) has no test either, though it is not part of
this task.
