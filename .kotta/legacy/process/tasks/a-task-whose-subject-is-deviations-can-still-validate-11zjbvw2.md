---
id: T-01m14j3afm6f2mqagd11zjbvw2
title: A task whose subject is deviations can still validate
status: done
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
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  - UC-01m0f0wn89dy38s6whbfa0jafn
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'A task whose acceptance conditions are about deviations validates when it declares none, because the check reads what the agent wrote about the run and not the condition the evidence is keyed by.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - UC-01m0f0wn89dy38s6whbfa0jafn
  'The case the check exists for still fails: a task whose evidence narrative admits a deviation while its Deviations field denies one is refused, and the refusal quotes the admission.':
    - UC-01m0f0wn89dy38s6whbfa0jafn
  'This workspace validates: kotta validate exits zero over its own records.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: ad33633146aad45a20a594fbf530ee59a20e1d90
resolution: completed
approved_by: cli
approved_at: '2026-08-28T16:32:57.570Z'
approval_basis: 'CLI --approve: task.close'
---
# T-01m14j3afm6f2mqagd11zjbvw2 — A task whose subject is deviations can still validate

## Outcome

`kotta validate` is red on this workspace and one test fails with it. The error is a false
positive against the sweep task closed today:

```
DEVIATION_MISMATCH: T-…cd55hcbs declares no deviations while the verification narrative
names one: "A task that declared a deviation and has no observation naming it is still
reported, and the action it names is one the "
```

The quoted line is that task's own **acceptance condition**. Review evidence is stored as
`<acceptance condition>: <evidence>` under `Verification performed`, so every condition text lands
inside the section the check scans (`src/core/validation.ts:79-81`). A task about deviations
therefore cannot pass, and the only exits are to declare a deviation that does not exist or to
avoid the word in a task named for it.

F-019 introduced the check for a real failure — a field saying `None.` while the narrative admitted
one — and that failure must still be caught.

## Scope

- What `DEVIATION_MISMATCH` scans: the evidence an agent wrote, not the acceptance condition it is
  keyed by.

## Non-goals

- The check's purpose or its refusal. The case it exists for keeps failing exactly as it does now.
- The Hungarian and English marker vocabulary, and the denial phrases, both unchanged.
- The storage format of review evidence.

## Acceptance

- A task whose acceptance conditions are about deviations validates when it declares none, because the check reads what the agent wrote about the run and not the condition the evidence is keyed by.
- The case the check exists for still fails: a task whose evidence narrative admits a deviation while its Deviations field denies one is refused, and the refusal quotes the admission.
- This workspace validates: kotta validate exits zero over its own records.

## Verification

- run: npx vitest run tests/integration/validation.test.ts tests/integration/deviation-reconciliation.test.ts
- run: npx vitest run tests/integration/questions.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The acceptance conditions are already parsed for coverage; the check reads the same list rather
  than guessing where a condition ends.

## Open decisions

None.

## Execution notes

Found by `kotta validate` going red the moment a task's subject collided with its vocabulary, which
is the first time in twenty-six days it could have.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A task whose acceptance conditions are about deviations validates when it declares none, because the check reads what the agent wrote about the run and not the condition the evidence is keyed by. | run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "own subject is deviations" — verified: exit 0 at 2eef9d1 |
| The case the check exists for still fails: a task whose evidence narrative admits a deviation while its Deviations field denies one is refused, and the refusal quotes the admission. | run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "still caught when it sits beside" — verified: exit 0 at 2eef9d1 |
| This workspace validates: kotta validate exits zero over its own records. | run: npx vitest run tests/integration/questions.test.ts -t "keep validating" — verified: exit 0 at 2eef9d1 |

### Verification performed

A task whose acceptance conditions are about deviations validates when it declares none, because the check reads what the agent wrote about the run and not the condition the evidence is keyed by.: run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "own subject is deviations"
The case the check exists for still fails: a task whose evidence narrative admits a deviation while its Deviations field denies one is refused, and the refusal quotes the admission.: run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "still caught when it sits beside"
This workspace validates: kotta validate exits zero over its own records.: run: npx vitest run tests/integration/questions.test.ts -t "keep validating"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
