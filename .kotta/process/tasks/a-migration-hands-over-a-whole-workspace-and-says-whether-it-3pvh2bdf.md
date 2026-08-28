---
id: T-01m14mgyrv00b7ye5r3pvh2bdf
title: 'A migration hands over a whole workspace, and says whether it holds'
status: defined
origin: human
types:
  - bug
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89x00jkpqpqc2esx9h
  - BR-01m0f1djtb5dkb76tjzq4x3ffh
branch: null
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'A migration that writes brings the rules file to what this Kotta would write, so the migrated workspace instructs agents from the running package and not from the shape it left.':
    - UC-01m0f0wn89x00jkpqpqc2esx9h
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'A hand-edited rules file is not replaced by a migration: it is reported as drifted, with the one command that discards those edits.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'A migration reports whether the workspace it produced satisfies validation, and names what failed when it does not.':
    - UC-01m0f0wn89x00jkpqpqc2esx9h
  'A dry run writes nothing: neither the rules file nor anything else changes, and it still says what the migration would do.':
    - UC-01m0f0wn89x00jkpqpqc2esx9h
---
## Outcome

`kotta migrate` carries the records forward and stops there. Two things it promises are missing.

The generated rules file is not refreshed. A workspace migrated from an older shape keeps the
`.kotta/AGENTS.md` it arrived with — describing the vocabulary, the commands and the install line
of the version it came from — while every agent in the project reads that file as current. The
migration moved the records out from under it.

And the migration reports success without knowing whether it produced something valid. It proves
identity is intact (no id lost) and nothing else. A workspace its own validator would refuse can
be reported as migrated, and the operator finds out at the next command.

## Scope

- `migrateWorkspace` refreshing the workspace rules file when it writes.
- `migrateWorkspace` reporting whether the workspace it produced satisfies validation.
- What the migration prints for both.

## Non-goals

- Repairing what validation finds: the migration reports, it does not fix. A workspace that
  migrated and does not validate is still migrated.
- The project's own AGENTS.md, which Kotta never rewrites here either.
- Replacing a hand-edited rules file: the drift rule holds, and `sync --replace-rules` stays the
  one deliberate way out of it.
- The dry run, which writes nothing and therefore refreshes nothing.

## Acceptance

- A migration that writes brings the rules file to what this Kotta would write, so the migrated workspace instructs agents from the running package and not from the shape it left.
- A hand-edited rules file is not replaced by a migration: it is reported as drifted, with the one command that discards those edits.
- A migration reports whether the workspace it produced satisfies validation, and names what failed when it does not.
- A dry run writes nothing: neither the rules file nor anything else changes, and it still says what the migration would do.

## Verification

- run: npx vitest run tests/integration/migrate.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The refresh goes through the same writer `sync` uses, so drift is decided in one place.
- Validation runs against the migrated root, after every write, and its outcome never turns a
  successful migration into a thrown error — the operator is told, not blocked.

## Open decisions

None.

## Execution notes

Both gaps came from the same field report: a `kotta migrate` in another repository reported success,
and the agent that read the workspace afterwards was still working from the old rules.
