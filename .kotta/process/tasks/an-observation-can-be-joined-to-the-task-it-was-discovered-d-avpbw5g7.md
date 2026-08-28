---
id: T-01m14h2mkjtrb8bkxsavpbw5g7
title: >-
  An observation can be joined to the task it was discovered during, after the
  fact
status: review
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89jqb5mpcjjt1j5j8p
  - UC-01m0f0wn89dy38s6whbfa0jafn
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'An observation written without the task it came from can be joined to it afterwards, through a command, and the deviation that task declared stops being reported.':
    - UC-01m0f0wn89jqb5mpcjjt1j5j8p
    - UC-01m0f0wn89dy38s6whbfa0jafn
  'A link already recorded is never silently replaced: naming a second task is refused, and the refusal names the task the record holds. Naming the same task again changes nothing.':
    - UC-01m0f0wn89jqb5mpcjjt1j5j8p
  'The task named must exist, and the operation is on both surfaces, because a chat that can capture a noticing can name where it came from.':
    - UC-01m0f0wn89jqb5mpcjjt1j5j8p
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 99744e6b491b3eb4f341281aea137075f28eea0f
---
# T-01m14h2mkjtrb8bkxsavpbw5g7 — An observation can be joined to the task it was discovered during, after the fact

## Outcome

`discovered_during` is written once, by `observation new --discovered-during`, and no command can
set it afterwards. Since the sweep started reading that link on 2026-08-27, an observation written
without the flag leaves its task's deviation reported forever: the finding is recorded, the link is
not, and nothing can join them.

The two ways out today are both wrong — write a second observation saying the same thing, or
hand-edit a Kotta-owned file. It happened within the hour: F-01m14fbdrst4pcr47ck1vz7ytk records
exactly what T-01m14enxw9tbbgv2kbbsxmnmpc's deviation left behind, written minutes apart, and the
report could not be told.

## Scope

- A command that records, on an existing observation, the task it was discovered during.
- Its declaration in the operation registry, and therefore its projection to both surfaces.

## Non-goals

- Any other field of an observation. This is not a general amend path: the rest of the record is
  what the capture said, and changing it is a different question with a different answer.
- The disposition's `related_task`, which answers a different question — what the observation
  became, not where it came from.
- Deciding which of the reported tasks each existing observation belongs to. This makes the joining
  possible; the joining itself is judgement, task by task.

## Acceptance

- An observation written without the task it came from can be joined to it afterwards, through a command, and the deviation that task declared stops being reported.
- A link already recorded is never silently replaced: naming a second task is refused, and the refusal names the task the record holds. Naming the same task again changes nothing.
- The task named must exist, and the operation is on both surfaces, because a chat that can capture a noticing can name where it came from.

## Verification

- run: npx vitest run tests/integration/observation.test.ts
- run: npx vitest run tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The record is memory, not a mutable field: overwriting a recorded link would lose the answer it
  already carried, so it is refused rather than replaced.
- A resolved observation is still joinable — where the noticing came from does not stop being true
  when it is dispositioned.

## Open decisions

None.

## Execution notes

Found while working the sweep's nineteen reported deviations down: the first item on the list could
not be cleared by the command the report itself recommends.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| An observation written without the task it came from can be joined to it afterwards, through a command, and the deviation that task declared stops being reported. | run: npx vitest run tests/integration/observation.test.ts -t "joined to it afterwards" — verified: exit 0 at bc0c2a1 |
| A link already recorded is never silently replaced: naming a second task is refused, and the refusal names the task the record holds. Naming the same task again changes nothing. | run: npx vitest run tests/integration/observation.test.ts -t "changes nothing, and a different one is refused" — verified: exit 0 at bc0c2a1 |
| The task named must exist, and the operation is on both surfaces, because a chat that can capture a noticing can name where it came from. | run: npx vitest run tests/integration/observation.test.ts tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts — verified: exit 0 at bc0c2a1 |

### Verification performed

An observation written without the task it came from can be joined to it afterwards, through a command, and the deviation that task declared stops being reported.: run: npx vitest run tests/integration/observation.test.ts -t "joined to it afterwards"
A link already recorded is never silently replaced: naming a second task is refused, and the refusal names the task the record holds. Naming the same task again changes nothing.: run: npx vitest run tests/integration/observation.test.ts -t "changes nothing, and a different one is refused"
The task named must exist, and the operation is on both surfaces, because a chat that can capture a noticing can name where it came from.: run: npx vitest run tests/integration/observation.test.ts tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts

### Deviations

The declared verification named the full suite, and the full suite has one failure this change did not cause: tests/integration/questions.test.ts asserts that this workspace validates, and kotta validate is red on main with a DEVIATION_MISMATCH false positive against the sweep task closed earlier today - the check reads that task subject as its confession, recorded as F-01m14h0t8ehy2yc37y8tn71ete. Every other file passes, 528 of 530. The evidence above therefore names the tests that measure this change rather than a suite whose one red is a separate recorded defect, and that defect is the next thing taken.

### Observations created

Not declared.

### Known concerns

Not declared.
