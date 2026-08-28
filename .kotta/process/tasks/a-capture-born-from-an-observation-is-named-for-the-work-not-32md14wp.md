---
id: T-01m14xe49h3afs5zpg32md14wp
title: 'A capture born from an observation is named for the work, not the symptom'
status: defined
origin: human
types:
  - bug
profiles: []
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
  - UC-01m0f0wn89fpwvdh3gz31cdtn9
branch: null
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'A create-task disposition can name the work: the title it carries is the created capture''s title, and the observation keeps its own.':
    - BR-01m0f0wn898xd4tr7j7t9bsjy7
    - UC-01m0f0wn89fpwvdh3gz31cdtn9
  'A disposition that names no title still creates the capture, and the result says the name is the observation''s and what would replace it.':
    - BR-01m0f0wn898xd4tr7j7t9bsjy7
  'A title is refused with any other disposition, the way spec and task already are, and the refusal names the disposition it belongs to.':
    - UC-01m0f0wn89fpwvdh3gz31cdtn9
---
## Outcome

`observation resolve --disposition create-task` mints the task with `String(entity.data.title)` —
the observation's own title. The observation is named for what was noticed; the task then carries
that symptom sentence as the name of the work, through the backlog list, every gate question, and
every summary a human reads, until someone retitles it at define.

Reported from the field, on two tasks at once: *"A két új task címe csúnya, mert a Kotta az
observation címét örökli."*

## Scope

- A title carried by the `create-task` disposition, on both surfaces: the CLI option and the
  approval payload the calling chat sends.
- What the result says when no title was given.

## Non-goals

- Requiring a title. A capture whose remedy is not yet worded is still worth capturing, and
  `task define` retitles; the fix is that the inherited name is named as a state to leave, not
  that intake gets a new refusal.
- Every other disposition, and the observation's own title, unchanged.
- Retitling the captures already created this way.

## Acceptance

- A create-task disposition can name the work: the title it carries is the created capture's title, and the observation keeps its own.
- A disposition that names no title still creates the capture, and the result says the name is the observation's and what would replace it.
- A title is refused with any other disposition, the way spec and task already are, and the refusal names the disposition it belongs to.

## Verification

- run: npx vitest run tests/integration/observation.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The payload rule mirrors the two references already scoped to one disposition each: `spec` to
  amend-spec, `task` to attach-to-existing-task, `title` to create-task.

## Open decisions

None.

## Execution notes

The remedy adds a sentence no node stated — that the two entities are named apart — so the spec
delta landed first, on the rule that already says an observation is not a task.
