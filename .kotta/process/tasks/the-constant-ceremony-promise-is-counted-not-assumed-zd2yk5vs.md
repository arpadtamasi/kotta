---
id: T-01m0jkmw2rxxwj4jfvzd2yk5vs
title: 'The constant-ceremony promise is counted, not assumed'
status: review
origin: human
types:
  - workflow
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - QA-01m0fp2hdkq55yrx9qr5t8pweh
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-26'
coverage:
  'A spec-covered task walked from captured intent to done crosses exactly one human gate. The walk is performed, not described, and a second gate on that path fails it.':
    - QA-01m0fp2hdkq55yrx9qr5t8pweh
  'Every gated transition on that walk records an approval receipt naming who approved, when, and on what basis; a transition that reaches its terminal state without one fails.':
    - QA-01m0fp2hdkq55yrx9qr5t8pweh
  'Captured intent reaches an executing agent in at most three steps, and the steps are counted from the commands actually invoked rather than from the documentation.':
    - QA-01m0fp2hdkq55yrx9qr5t8pweh
  'Where this workspace''s own history cannot meet the promise, the boundary is named and dated rather than the failing entities being quietly excluded from the count.':
    - QA-01m0fp2hdkq55yrx9qr5t8pweh
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 95263309e7d10caebf356b5151db488f05a5b6cb
---
# T-01m0jkmw2rxxwj4jfvzd2yk5vs — The constant-ceremony promise is counted, not assumed

## Outcome

The three numbers `Proportionate ceremony` states are asserted by a test that walks the lifecycle,
so the promise stops being a sentence nobody checked. The node is admitted `structural` today: its
form is one no single code site would name, and nothing has ever measured it.

The capture this task carried was titled "Ceremony scales with stakes" and proposed the opposite —
less ceremony for a typo, more for a migration. `D-01m0zxbm2k60g0apj2f5ke6pb8` settled it: ceremony
is constant, because scaling it would mean the tool deciding when not to ask the human. What
remains of the capture is what keeping the constant promise requires.

## Scope

- A test that walks one spec-covered task from `task new` to `done` and counts the human gates on
  that path, the receipts recorded, and the steps taken to reach an executing agent.
- The measurement over this workspace's own closed tasks, with the boundary the receipt mechanism
  created stated in the assertion rather than worked around.

## Non-goals

- Changing any gate. The promise is being measured, not renegotiated; if a case ever needs a second
  gate it arrives as an amendment with its reason (D-01m0zxbm2k60g0apj2f5ke6pb8).
- The gates outside the spec-covered task path — observation resolution, decision recording, batch
  close — which the quality attribute does not count.
- Making the numbers configurable. A measure that a project can lower is not a measure.

## Acceptance

- A spec-covered task walked from captured intent to done crosses exactly one human gate. The walk is performed, not described, and a second gate on that path fails it.
- Every gated transition on that walk records an approval receipt naming who approved, when, and on what basis; a transition that reaches its terminal state without one fails.
- Captured intent reaches an executing agent in at most three steps, and the steps are counted from the commands actually invoked rather than from the documentation.
- Where this workspace's own history cannot meet the promise, the boundary is named and dated rather than the failing entities being quietly excluded from the count.

## Verification

- run: npx vitest run tests/integration/proportionate-ceremony.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The walk uses the product path, not a fixture that reaches `done` by writing files: a promise
  measured against a shortcut measures the shortcut.
- The receipt assertion reads the recorded receipt, never the command's own report of success.

## Open decisions

None.

## Execution notes

Measured before defining, on this workspace: 109 closed tasks, 54 carrying a receipt. Broken down
by the date they closed, every task closed on or after 2026-08-21 carries one — 46 of 46 — and the
55 without predate the receipt mechanism entirely. The promise is kept today; nothing proves it
stays kept, and the raw ratio is the kind of number that reads as a violation when it is history.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A spec-covered task walked from captured intent to done crosses exactly one human gate. The walk is performed, not described, and a second gate on that path fails it. | run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "one refuses" — verified: exit 0 at 0511d9c |
| Every gated transition on that walk records an approval receipt naming who approved, when, and on what basis; a transition that reaches its terminal state without one fails. | run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "different exit" — verified: exit 0 at 0511d9c |
| Captured intent reaches an executing agent in at most three steps, and the steps are counted from the commands actually invoked rather than from the documentation. | run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "offered without approval first" — verified: exit 0 at 0511d9c |
| Where this workspace's own history cannot meet the promise, the boundary is named and dated rather than the failing entities being quietly excluded from the count. | run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "since that exit first recorded one\|does not count" — verified: exit 0 at 0511d9c |

### Verification performed

A spec-covered task walked from captured intent to done crosses exactly one human gate. The walk is performed, not described, and a second gate on that path fails it.: run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "one refuses"
Every gated transition on that walk records an approval receipt naming who approved, when, and on what basis; a transition that reaches its terminal state without one fails.: run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "different exit"
Captured intent reaches an executing agent in at most three steps, and the steps are counted from the commands actually invoked rather than from the documentation.: run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "offered without approval first"
Where this workspace's own history cannot meet the promise, the boundary is named and dated rather than the failing entities being quietly excluded from the count.: run: npx vitest run tests/integration/proportionate-ceremony.test.ts -t "since that exit first recorded one|does not count"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
