---
id: T-01m1495aj3zx7yhs04cd55hcbs
title: >-
  A declared deviation is answered by the link, not by the prose it was written
  beside
status: defined
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89dy38s6whbfa0jafn
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
branch: null
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
source_observation: F-01m1459gr68tzycg8fdvgxqgan
coverage:
  'An observation captured with --discovered-during naming the closed task clears that task from the report, without the task being reopened or any file being edited by hand.':
    - UC-01m0f0wn89dy38s6whbfa0jafn
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'A task that declared a deviation and has no observation naming it is still reported, and the action it names is one the operator can actually take.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'The prose an agent wrote at review time still counts: a task whose Observations created section names something is not reported, so nothing that was accounted for before becomes an item now.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
---
# T-01m1495aj3zx7yhs04cd55hcbs — A declared deviation is answered by the link, not by the prose it was written beside

## Outcome

Recording what a deviation left behind clears it from the report. Today it does not, and the
category cannot be satisfied through the product at all.

`kotta observation new --discovered-during <task>` validates the task, writes `discovered_during`
on the observation and appends a lifecycle event (`src/commands/observation.ts:61-68`). The sweep
never reads it: `src/commands/sweep.ts:170` decides from `reviewSection(body, "Observations
created")` on the closed task, and the file contains zero references to `discovered_during`.

That prose section is written once, at review submission. On a `done` task there is no path to
change it: reopening the task, or hand-editing a Kotta-owned process file — which the agent that
reported this correctly refused to do. So the report names thirty items in this workspace and an
action that does not clear any of them, which teaches its reader to stop believing it.

## Scope

- What `undeclared-deviation` reads: the observations' own `discovered_during`, in addition to the
  prose an agent may have written at review time.
- The action the item names, so it is one the operator can take from where they are.

## Non-goals

- The other six sweep categories.
- The review submission itself: writing the prose section stays exactly as it is, and a task that
  used it stays accounted for.
- The thirty historical items. Those that already have a linked observation fall out by being read
  correctly; the rest are a separate reckoning, and this task does not do it.

## Acceptance

- An observation captured with --discovered-during naming the closed task clears that task from the report, without the task being reopened or any file being edited by hand.
- A task that declared a deviation and has no observation naming it is still reported, and the action it names is one the operator can actually take.
- The prose an agent wrote at review time still counts: a task whose Observations created section names something is not reported, so nothing that was accounted for before becomes an item now.

## Verification

- run: npx vitest run tests/integration/sweep.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- Sweep still writes nothing and still runs where validate refuses.
- Reading the observations is one directory listing the report already performs; the category must
  not turn a cheap read into a scan per task.

## Open decisions

None.

## Execution notes

Shipped by this session on 2026-08-26 and reported from a live project the next morning. The task
was minted by the create-task disposition and inherited the observation's title, which states the
symptom; it is retitled here to the outcome, which is what the specification now requires of a task
title.
