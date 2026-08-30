---
id: T-01m199skkmpg216qgkdbf8my5d
title: 'Submission is a boundary the tool holds, in both directions'
status: review
origin: human
types:
  - feature
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-30'
updated_at: '2026-08-30'
coverage:
  'A submission records the commit it stands on, always — not only when a declared check happened to run.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  'Work that lands on a task''s branch after its submission is reported, named by commit, wherever the human meets that task — the sweep and the close gate.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  'A claim that accounted for nothing is said at submission: when no commit landed between the start and the submission, the record says the work predates the claim.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 72ce691a84189b7e2f5f72edf5323b03a71f750a
review_commit: 8148786f3acd762d81e43fd423c238996295708d
---
## Outcome

The state machine now says submission is a boundary the tool holds, in both directions. Nothing
holds it. Two failures from 2026-08-29, both mine, both invisible to the tool:

- Work continued against a task already in review — the init prompt built on top of an
  already-submitted task (F-01m14eq1kjmxz28f01k1vz7ytk).
- Execution began before a claim existed — the board's specification panel was written, tested and
  committed, and the task was captured afterwards.

Neither could be caught, because the record has no anchor. `review_commit` does not exist: the
submission computes a short sha for the evidence table only when a `run:` check happens to be
declared, prints it into prose, and forgets it. With nothing stored, "after the submission" and
"during the claim" are not questions the workspace can answer.

## Scope

- The commit a submission stands on, recorded in the task.
- Reading the boundary in both directions from `start_commit` and that commit.
- Saying it where a human meets the task: at submission, in the sweep, and at the close gate.

## Non-goals

- Refusing. Both shapes have honest instances — a branch that gained its base back through a merge,
  a task whose deliverable legitimately predates its claim — and a refusal firing on those would
  cost more than the silence does. The rule says refused *or* reported; this reports, and the human
  decides with the fact in front of them.
- Judging what the extra commits contain. The boundary is that they exist and were not part of what
  was submitted.
- The batch coordinator's own branch, which is not a task's branch.

## Acceptance

- A submission records the commit it stands on, always — not only when a declared check happened to run.
- Work that lands on a task's branch after its submission is reported, named by commit, wherever the human meets that task — the sweep and the close gate.
- A claim that accounted for nothing is said at submission: when no commit landed between the start and the submission, the record says the work predates the claim.

## Verification

- run: npx vitest run tests/integration/submission-boundary.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The boundary is read from Git, from commits the record already names, and never from a timestamp
  or a file mtime.
- A task whose branch no longer exists, or which never recorded a commit, reports nothing rather
  than guessing — an older task is not retroactively accused.

## Open decisions

None.

## Execution notes

This is the half of yesterday that is still only good intentions: the sentence landed, the tool
does not hold it. Both instances it would have caught were mine.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A submission records the commit it stands on, always — not only when a declared check happened to run. | run: npx vitest run tests/integration/submission-boundary.test.ts -t "recorded even when no declared check ran" — verified: exit 0 at 8148786 |
| Work that lands on a task's branch after its submission is reported, named by commit, wherever the human meets that task — the sweep and the close gate. | run: npx vitest run tests/integration/submission-boundary.test.ts -t "named by commit in the sweep\|named at the close gate\|says nothing when nothing landed" — verified: exit 0 at 8148786 |
| A claim that accounted for nothing is said at submission: when no commit landed between the start and the submission, the record says the work predates the claim. | run: npx vitest run tests/integration/submission-boundary.test.ts -t "a claim that accounted for nothing" — verified: exit 0 at 8148786 |

### Verification performed

A submission records the commit it stands on, always — not only when a declared check happened to run.: run: npx vitest run tests/integration/submission-boundary.test.ts -t "recorded even when no declared check ran"
Work that lands on a task's branch after its submission is reported, named by commit, wherever the human meets that task — the sweep and the close gate.: run: npx vitest run tests/integration/submission-boundary.test.ts -t "named by commit in the sweep|named at the close gate|says nothing when nothing landed"
A claim that accounted for nothing is said at submission: when no commit landed between the start and the submission, the record says the work predates the claim.: run: npx vitest run tests/integration/submission-boundary.test.ts -t "a claim that accounted for nothing"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
