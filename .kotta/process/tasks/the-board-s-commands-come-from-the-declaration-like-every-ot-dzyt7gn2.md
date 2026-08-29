---
id: T-01m160z5twbnc4vr09dzyt7gn2
title: 'The board''s commands come from the declaration, like every other surface''s'
status: active
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
  - BR-01m0nsyasfnjc9s4073r8zb33j
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-29'
updated_at: '2026-08-29'
coverage:
  'Every command the board prints is one the operation registry declares, and the two sites that named a removed one name the current one instead.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
  'A command the board prints that no declaration carries fails the suite, naming the command and where it is printed — so the next rename cannot pass the board by.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 34cfd13620aec61906488b042abbc8cccbe22404
---
## Outcome

The board tells the operator to run `kotta task sign <id> --approve`. Running it answers
`error: unknown command 'sign'`. `sign` is the pre-rename word for `task define`; the CLI, the MCP
surface, the skills and the rules file all moved, and the board did not.

Two sites print it: the empty *What runs next?* panel, and the CLI fallback sheet. The panel's prose
is inverted with it — *"Shape a backlog task until it validates, then define it"* — when defining is
what validates.

The reason it went unnoticed through a whole vocabulary rename is the interesting half. Both other
surfaces are derived from one operation registry and their totality is asserted as a set comparison.
The board's commands are hand-written literals in a third surface that nothing derives and no test
reads. Being read-only kept it from acting on the stale word; it did not keep it from handing that
word to a human.

## Scope

- The command strings the board prints, and the prose that carries them.
- A check that reads them and compares them against the declared surface.

## Non-goals

- Deriving the board's *rendering* from the registry. The board is not a projection of the operation
  list; it prints a handful of commands as guidance, and what has to hold is that each one exists.
- Making the board able to run anything. It stays read-only.
- The rest of the board's copy, unchanged.

## Acceptance

- Every command the board prints is one the operation registry declares, and the two sites that named a removed one name the current one instead.
- A command the board prints that no declaration carries fails the suite, naming the command and where it is printed — so the next rename cannot pass the board by.

## Verification

- run: npx vitest run tests/ui/board-commands.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The check reads the board's source, not a list copied beside it: a second hand-maintained list
  would be the same failure with an extra step.

## Open decisions

None.

## Execution notes

Reported by the operator, at sight, as "A kotta ui még a régi!". Recorded as
F-01m16dp6xspd9kj3d4pe6rqcre, whose amend-spec delta extended the declaration rule to any surface
that puts a command in front of a human.
