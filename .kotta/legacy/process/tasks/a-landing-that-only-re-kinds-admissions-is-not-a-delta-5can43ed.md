---
id: T-01m120js1qey632tbv5can43ed
title: A landing that only re-kinds admissions is not a delta
status: done
origin: observation
types:
  - bug
profiles: []
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-27'
updated_at: '2026-08-29'
source_observation: F-01m0t75ff4eg3nm0gtwg7qqm4b
coverage:
  'A landing that changed only nodes'' admission bookkeeping produces no delta section: nothing moved, so nothing leads the report.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'A landing that changed what a node promises still leads the report, and a node changed alongside bookkeeping-only neighbours is the one listed.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'Where a landing touched more nodes than it changed agreements in, the report says both numbers.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 1efb238a95bd23d8f2516b936d4839568b0307ab
resolution: completed
approved_by: cli
approved_at: '2026-08-29T01:21:07.551Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

`kotta gap` opens with `## Latest accepted spec delta`, built from every path the last commit
touching `spec/` changed. Measured on the branch at 550ffc6: 107 entries, because kinding every
admission touched every node. The section exists so a fresh landing leads the report; a delta that
is the whole specification leads nowhere and implies 107 new agreements that were never made.

An admission says which kind of gap a node has and why. That is bookkeeping about the evidence,
not a change to what the node promises. A landing that moved only that moved no agreement.

## Scope

- Which changed paths count as the delta.
- The one line that says what the landing touched versus what it changed.

## Non-goals

- The admission kinds, the sections below the delta, and the evidence rule, all unchanged.
- Deciding what an old landing meant: the comparison is between the landing commit and its parent,
  the same two trees the section already reads.

## Acceptance

- A landing that changed only nodes' admission bookkeeping produces no delta section: nothing moved, so nothing leads the report.
- A landing that changed what a node promises still leads the report, and a node changed alongside bookkeeping-only neighbours is the one listed.
- Where a landing touched more nodes than it changed agreements in, the report says both numbers.

## Verification

- run: npx vitest run tests/integration/gap.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The analysis stays a read: no index refresh, no write, and the comparison uses committed bytes
  from the two trees it already names.

## Open decisions

None.

## Execution notes

Noticed while fixing the repetition in T-01m0t6y6mrz2qv285gqfanyvza and left alone as outside its
scope; recorded as F-01m0t75ff4eg3nm0gtwg7qqm4b.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A landing that changed only nodes' admission bookkeeping produces no delta section: nothing moved, so nothing leads the report. | run: npx vitest run tests/integration/gap-report.test.ts -t "only re-kinds admissions moves nothing" — verified: exit 0 at e60d0c3 |
| A landing that changed what a node promises still leads the report, and a node changed alongside bookkeeping-only neighbours is the one listed. | run: npx vitest run tests/integration/gap-report.test.ts -t "whose promise changed leads the report" — verified: exit 0 at e60d0c3 |
| Where a landing touched more nodes than it changed agreements in, the report says both numbers. | run: npx vitest run tests/integration/gap-report.test.ts -t "both numbers are said" — verified: exit 0 at e60d0c3 |

### Verification performed

A landing that changed only nodes' admission bookkeeping produces no delta section: nothing moved, so nothing leads the report.: run: npx vitest run tests/integration/gap-report.test.ts -t "only re-kinds admissions moves nothing"
A landing that changed what a node promises still leads the report, and a node changed alongside bookkeeping-only neighbours is the one listed.: run: npx vitest run tests/integration/gap-report.test.ts -t "whose promise changed leads the report"
Where a landing touched more nodes than it changed agreements in, the report says both numbers.: run: npx vitest run tests/integration/gap-report.test.ts -t "both numbers are said"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
