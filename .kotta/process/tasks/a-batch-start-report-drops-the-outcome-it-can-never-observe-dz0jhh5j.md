---
id: T-01m120jsvqwswpkdvhdz0jhh5j
title: A batch start report drops the outcome it can never observe
status: defined
origin: observation
types:
  - bug
profiles: []
priority: low
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
branch: null
pull_request: null
created_at: '2026-08-27'
updated_at: '2026-08-28'
source_observation: F-01m0zpg89ydwy8q0ygtg485bq5
coverage:
  'The batch start rendering no longer asserts that every member is done, because no result it can receive says that.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  'Completing the last member of a started batch completes the batch, and a start after that is refused by name rather than answered with an empty dispatch.':
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
---
## Outcome

`renderBatchStart` ends with a line that fires when a release dispatched nothing, nothing is
waiting and nothing is running: `No tasks were dispatched; every member is done.`

No result reaching that renderer can say so. Closing or cancelling a task completes every open
batch that holds it, walking upward until a pass changes nothing, and a completed batch is
refused by `batch start` before any report is produced. The only way to observe the line is to
hand-edit a task's stored status — which is the one thing the rules forbid, so it proves nothing
about what an operator can reach.

The rendering therefore asserts an outcome no result supports. It is not wrong about the
vocabulary; it is a claim about a state that does not occur.

## Scope

- The unreachable line in `renderBatchStart`.
- A test that states, positively, what does happen when the last member finishes.

## Non-goals

- Automatic batch completion, the human close gate, and every other branch of the report, all
  unchanged.
- Whether defining should be able to tell an acceptance condition that no state satisfies from one
  that is merely unproven. That question is the second half of F-01m0zpg89ydwy8q0ygtg485bq5 and
  stays with it: answering it changes the coverage gate, which is far larger than this line.

## Acceptance

- The batch start rendering no longer asserts that every member is done, because no result it can receive says that.
- Completing the last member of a started batch completes the batch, and a start after that is refused by name rather than answered with an empty dispatch.

## Verification

- run: npx vitest run tests/integration/batch.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The test drives the supported commands end to end; it never writes a stored status by hand,
  which is what made the original reading of this line look reachable.

## Open decisions

None.

## Execution notes

This came from a deviation declared at review on T-01m0jdntvbbp5rbj6t2eqpd0tg: an acceptance
condition ended 'and a batch whose members are all done still says so', and the reachable half was
what actually shipped. The deviation is recorded as F-01m0zpg89ydwy8q0ygtg485bq5; this closes the
half that is a line of code.
