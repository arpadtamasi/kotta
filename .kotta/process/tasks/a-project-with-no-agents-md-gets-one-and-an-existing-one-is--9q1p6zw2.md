---
id: T-01m14azk11h5gk58vv9q1p6zw2
title: >-
  A project with no AGENTS.md gets one, and an existing one is joined with a
  sentence
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
  - BR-01m0f1djtb5dkb76tjzq4x3ffh
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'kotta init in a repository with no AGENTS.md creates it carrying the reference, without a flag and without asking: there is nothing to protect, and the rules reach the agents that will work there.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'What Kotta writes into a project file says what the reference is. A bare pointer line is never what a reader is left with, whether the file was created or appended to.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'An existing AGENTS.md is still only appended to after an explicit yes, idempotently, and every prior byte survives in order.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'The shipped setup skill carries the judgement path: an agent that has read the project file places the reference where it belongs in that document, shows the diff, and applies it on the human yes.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: adfc2fcf10951d3ae7c338e325b2843191a57276
---
# T-01m14azk11h5gk58vv9q1p6zw2 — A project with no AGENTS.md gets one, and an existing one is joined with a sentence

## Outcome

`kotta init` in a fresh repository leaves nothing dangling. Today it writes `.kotta/AGENTS.md` and
reports that it did not touch the project's own file — in a repository that has no such file, so
the rules exist and nothing points at them. The operator hit this starting a project on 2026-08-27.

Where a file does exist, `--link-agents` appends the bare line `@.kotta/AGENTS.md` after whatever
the document happened to end with: a naked reference with no sentence saying what it is.

`D-01m13v4eqfhv5213paeqdn4tbm` settled both: an absent file is created unasked, and an existing one
is joined by an agent that has read it. The CLI keeps a deterministic path for environments with no
agent, and that path stops writing a bare line.

## Scope

- `linkProjectAgents` in `src/commands/agents.ts`: what it writes when it creates, and when it appends.
- `kotta init`: creating the project file when there is none, without a flag.
- The `setup-kotta` skill: the judgement path for a file that already exists.

## Non-goals

- `.kotta/AGENTS.md` itself, which Kotta already owns and keeps current.
- Rewriting or reordering anything a project already wrote: an existing file is still only appended
  to, and only after an explicit yes.
- Teaching the CLI to place the reference intelligently. It has no judgement to place it with; that
  is why the skill exists.

## Acceptance

- kotta init in a repository with no AGENTS.md creates it carrying the reference, without a flag and without asking: there is nothing to protect, and the rules reach the agents that will work there.
- What Kotta writes into a project file says what the reference is. A bare pointer line is never what a reader is left with, whether the file was created or appended to.
- An existing AGENTS.md is still only appended to after an explicit yes, idempotently, and every prior byte survives in order.
- The shipped setup skill carries the judgement path: an agent that has read the project file places the reference where it belongs in that document, shows the diff, and applies it on the human yes.

## Verification

- run: npx vitest run tests/integration/sync.test.ts tests/integration/init.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- Creating a file is not the same as writing into one: the unasked path applies only where there is
  nothing to protect.
- Idempotence holds on both paths — running either again changes nothing.

## Open decisions

None.

## Execution notes

Found by the operator on their own first project, minutes after `kotta init`.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| kotta init in a repository with no AGENTS.md creates it carrying the reference, without a flag and without asking: there is nothing to protect, and the rules reach the agents that will work there. | run: npx vitest run tests/integration/sync.test.ts -t "without a flag and without asking" — verified: exit 0 at 2e698cb |
| What Kotta writes into a project file says what the reference is. A bare pointer line is never what a reader is left with, whether the file was created or appended to. | run: npx vitest run tests/integration/sync.test.ts -t "says what the reference is" — verified: exit 0 at 2e698cb |
| An existing AGENTS.md is still only appended to after an explicit yes, idempotently, and every prior byte survives in order. | run: npx vitest run tests/integration/sync.test.ts -t "leaves an existing project file alone\|changes nothing" — verified: exit 0 at 2e698cb |
| The shipped setup skill carries the judgement path: an agent that has read the project file places the reference where it belongs in that document, shows the diff, and applies it on the human yes. | run: grep -q "you.. place the reference" skills/setup-kotta/SKILL.md — verified: exit 0 at 2e698cb |

### Verification performed

kotta init in a repository with no AGENTS.md creates it carrying the reference, without a flag and without asking: there is nothing to protect, and the rules reach the agents that will work there.: run: npx vitest run tests/integration/sync.test.ts -t "without a flag and without asking"
What Kotta writes into a project file says what the reference is. A bare pointer line is never what a reader is left with, whether the file was created or appended to.: run: npx vitest run tests/integration/sync.test.ts -t "says what the reference is"
An existing AGENTS.md is still only appended to after an explicit yes, idempotently, and every prior byte survives in order.: run: npx vitest run tests/integration/sync.test.ts -t "leaves an existing project file alone|changes nothing"
The shipped setup skill carries the judgement path: an agent that has read the project file places the reference where it belongs in that document, shows the diff, and applies it on the human yes.: run: grep -q "you.. place the reference" skills/setup-kotta/SKILL.md

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
