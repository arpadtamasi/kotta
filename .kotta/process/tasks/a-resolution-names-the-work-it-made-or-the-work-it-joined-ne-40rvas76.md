---
id: T-01m16k535zbdxa0y6940rvas76
title: >-
  A resolution names the work it made, or the work it joined — never the wrong
  one
status: review
origin: human
types:
  - bug
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-29'
updated_at: '2026-08-29'
coverage:
  'Attaching an observation to work that already exists is not reported as capturing new work, and the line names the task it was folded into.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  'A capture reports the name the created task actually carries, whether the disposition supplied it or it fell back to the observation''s.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - BR-01m0f0wn898xd4tr7j7t9bsjy7
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: e45f5211c2fc58840e498823d8182e67d9ba5722
---
## Outcome

Resolving three observations with `attach-to-existing-task` printed:

```
Captured A task about deviations cannot pass validation… (T-11zjbvw2) in the backlog.
```

Nothing was captured. The observations were folded into work that already existed and was already
done. The line is wrong twice over: it announces a creation that did not happen, and it names the
existing task's id beside the observation's title, so the two halves belong to different entities.

The renderer branches on `taskId` being present, which both constructive dispositions set — one
because it minted a task, the other because it named one. And the result carries no title for the
task at either end, so even the create-task line reports the observation's name rather than the
work's whenever a `--task-title` was given.

Both are the same rule failing: a rendering never claims more than the result carries
(BR-01m0pw5bc7b1rkg5dct5qgdkmb). I wrote this renderer under that rule.

## Scope

- What the result of `observation resolve` carries about the task at its far end.
- What the terminal prints for each of the two dispositions that name one.

## Non-goals

- The dispositions themselves, their records, and the `--task-title` option, all unchanged and all
  correct on disk: only the spoken line was wrong.
- The other dispositions, which name no task and print no such line.

## Acceptance

- Attaching an observation to work that already exists is not reported as capturing new work, and the line names the task it was folded into.
- A capture reports the name the created task actually carries, whether the disposition supplied it or it fell back to the observation's.

## Verification

- run: npx vitest run tests/integration/observation.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The title comes from the task the resolution acted on, read where the resolution already reads it,
  not guessed from the observation beside it.

## Open decisions

None.

## Execution notes

Found by using it: three bookkeeping resolutions the operator approved printed a sentence that was
false about all three.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Attaching an observation to work that already exists is not reported as capturing new work, and the line names the task it was folded into. | run: npx vitest run tests/integration/observation.test.ts -t "not reported as capturing new work" — verified: exit 0 at 1228cfe |
| A capture reports the name the created task actually carries, whether the disposition supplied it or it fell back to the observation's. | run: npx vitest run tests/integration/observation.test.ts -t "named for the work when the disposition names it\|still created without a title" — verified: exit 0 at 1228cfe |

### Verification performed

Attaching an observation to work that already exists is not reported as capturing new work, and the line names the task it was folded into.: run: npx vitest run tests/integration/observation.test.ts -t "not reported as capturing new work"
A capture reports the name the created task actually carries, whether the disposition supplied it or it fell back to the observation's.: run: npx vitest run tests/integration/observation.test.ts -t "named for the work when the disposition names it|still created without a title"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
