---
id: T-01m19v5wx9wd9pf77rdvhtr3s5
title: A deviation that left nothing behind has a way to say so
status: review
origin: human
types:
  - feature
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
branch: >-
  feat/T-01m19v5wx9wd9pf77rdvhtr3s5-a-deviation-that-left-nothing-behind-has-a-way-to-say-so
pull_request: null
created_at: '2026-08-30'
updated_at: '2026-08-30'
coverage:
  'A declared deviation that left nothing behind can be recorded as such, with the reason it left nothing, and the sweep stops raising it.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'The record says who settled it and when, and never claims a human approval that was not given.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'Settling is refused where it would be a lie: a task that declared no deviation, a task that has not ended, and one already settled.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
    - BR-01m0f0wn898xd4tr7j7t9bsjy7
assigned_agent: claude
worktree: .worktrees/T-01m19v5wx9wd9pf77rdvhtr3s5
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 5289436c7ad64864c7bca84ec4634dd4c9812c51
review_commit: 6a4b4fc3ad97e4d87542a59a2bb0da4b3f61cc02
---
## Outcome

`kotta sweep` raises 20 `undeclared-deviation` items, all 26 days old, and offers one action:
record an observation. For most of them that action is a lie. All 19 were read on 2026-08-28: the
majority declare an interpretation that was argued and accepted at review and left nothing behind —
a port range explained, a changelog entry, `endsWith` instead of an exact path on macOS. A handful
name something real, and those became observations.

The rest cannot leave. The only exit is to invent an observation about nothing, so the honest
operator leaves them, and the list grows: today it is 20, because the two deviations declared
yesterday joined it. A report whose only exit is to create work can only grow, and a list that only
grows stops being read — which costs more than the items on it.

## Scope

- Recording that a closed task's declared deviation left nothing behind, and why.
- The sweep reading that record.
- Both surfaces, because the sweep is read from the chat as much as from the terminal.

## Non-goals

- Judging whether it is true. The reason is written by whoever settles it and stands in the record
  under their name; this is bookkeeping about an acceptance the review already carried, not a new
  gate and not a new approval.
- Every other sweep category, and the deviation prose itself, unchanged.
- The 20 standing items. This gives them a door; walking each through it is judgement, and it is
  the operator's.

## Acceptance

- A declared deviation that left nothing behind can be recorded as such, with the reason it left nothing, and the sweep stops raising it.
- The record says who settled it and when, and never claims a human approval that was not given.
- Settling is refused where it would be a lie: a task that declared no deviation, a task that has not ended, and one already settled.

## Verification

- run: npx vitest run tests/integration/deviation-settled.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The reason is required and non-empty: "nothing was left behind" without saying why is the same
  silence the item exists to break.
- No approval receipt is stamped. The record names the actor, and an actor is not an approver.

## Open decisions

None.

## Execution notes

The disposition that asked for this read all 19 items first. The sentence it landed is the one this
executes: every item the sweep raises has a way to leave it, including the finding that nothing was
left behind.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A declared deviation that left nothing behind can be recorded as such, with the reason it left nothing, and the sweep stops raising it. | run: npx vitest run tests/integration/deviation-settled.test.ts -t "takes it out of the sweep" — verified: exit 0 at 6a4b4fc |
| The record says who settled it and when, and never claims a human approval that was not given. | run: npx vitest run tests/integration/deviation-settled.test.ts -t "claims no approval" — verified: exit 0 at 6a4b4fc |
| Settling is refused where it would be a lie: a task that declared no deviation, a task that has not ended, and one already settled. | run: npx vitest run tests/integration/deviation-settled.test.ts -t "cannot be settled\|not settled twice\|not a reason" — verified: exit 0 at 6a4b4fc |

### Verification performed

A declared deviation that left nothing behind can be recorded as such, with the reason it left nothing, and the sweep stops raising it.: run: npx vitest run tests/integration/deviation-settled.test.ts -t "takes it out of the sweep"
The record says who settled it and when, and never claims a human approval that was not given.: run: npx vitest run tests/integration/deviation-settled.test.ts -t "claims no approval"
Settling is refused where it would be a lie: a task that declared no deviation, a task that has not ended, and one already settled.: run: npx vitest run tests/integration/deviation-settled.test.ts -t "cannot be settled|not settled twice|not a reason"

### Deviations

None.

### Observations created

F-xhd61x8s — the published task schema forbids six fields the tool itself writes. Found while declaring deviation_settled in schemas/task.schema.json; review_commit, branch_origin, start_ref, start_commit, cancellation_reason and superseded_by are all written and none declared, under additionalProperties: false.

### Known concerns

The refusal for a task that has not ended is state !== "done", because done is where every ending lands — completed and retired alike carry it, with the resolution saying which. A cancelled task is therefore not refused by that guard; it is refused by the next one, since it never went through review and declared no deviation. The BR the third condition covers (an observation is not a task) stays unexamined: this enforces one sliver of it — settling cannot stand in for capturing a real finding — not the whole rule.
