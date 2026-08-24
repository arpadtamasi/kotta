---
id: T-01m0t28mkgg06jbgd7k7fppjk0
title: An admission says which kind it is
status: active
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
  - BR-01m0swjgrreeby1pyfdzf4mf7d
  - EX-01m0swjgrrnzqgx83v95t855xe
  - UC-01m0fpqfxjvet99wbz0v1ag64q
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-24'
updated_at: '2026-08-24'
coverage:
  'An admission names its kind, and one that does not is refused. `kotta gap` accepts `structural:`, `unexamined:` and `unimplemented:` entries, and fails on an `accepted` entry that names none of them, saying which kinds it may choose from.':
    - BR-01m0swjgrreeby1pyfdzf4mf7d
    - EX-01m0swjgrrnzqgx83v95t855xe
  'The report counts the three apart. The summary line carries a count per kind rather than one total, and each admission is listed under its own kind with its reason.':
    - BR-01m0swjgrreeby1pyfdzf4mf7d
    - EX-01m0swjgrrnzqgx83v95t855xe
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'This workspace''s inherited admissions carry a kind, and the bulk assignment says it was made by form. Every node admitted on 2026-08-23 is `structural` or `unexamined`, none is `unimplemented`, and the structural reasons state that the kind follows from the node''s form rather than from examining that node.':
    - BR-01m0swjgrreeby1pyfdzf4mf7d
  'The ratchet keeps its force. A node with neither evidence nor an admission still fails the command, unchanged by the kinds.':
    - BR-01m0swjgrreeby1pyfdzf4mf7d
    - UC-01m0fpqfxjvet99wbz0v1ag64q
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 00dd4a04f5541b752e4fefc3a02b98e63ad55e8f
---
## Outcome

`kotta gap` reports a number a reader can act on. Today it reports 106 admitted gaps carrying one sentence between them, and the triage at b652d4e showed that number is three situations wearing one label: 52 nodes of forms no code site would ever name, and 54 examples and business rules whose sample turned out to be enforced and proven but never mentioned by id.

A count that moves for three different reasons cannot be read, and a measure nobody can read stops being consulted — which is how a promise goes unkept in the first place.

## Scope

- Three admission kinds — `structural`, `unexamined`, `unimplemented` — read where `implementation:` is read today, and an admission naming none of them refused.
- The report's summary line and body count and group by kind.
- This workspace's 106 inherited admissions gain a kind: `structural` for the nine forms no single site names, `unexamined` for examples and business rules. The structural wording states that the kind follows from the form.

## Non-goals

- Judging any node's kind on its merits. Assigning `unimplemented` to a node means someone looked, and nobody has; the honest bulk assignment is `unexamined`, which is what it is for.
- Reducing the total. Nothing here makes a promise kept — it makes the count legible.
- Retiring `implementation:` as an accepted spelling for existing workspaces beyond this one, which is a compatibility question this task does not open.

## Constraints

The bulk re-labelling must not claim a judgement that was not made. `structural` is assigned from the node's form and says so in its own text; anything else stays `unexamined` however likely it is to be fine.

The ratchet's force is unchanged: a node with neither evidence nor an admission still fails.

## Open decisions

None.

## Execution notes

`acceptedImplementationReason` at `src/commands/gap.ts:133` reads the `accepted` list for an `implementation:`, `implementation-gap:` or `verification:` key. The kinds join it there, and `AcceptedImplementationGap` carries the kind so `formatGapReport` can group.

The nine structural forms, from the triage: use-case, glossary-term, entity, quality-attribute, goal, interface, actor, user-story, state-machine. Examples and business rules are the two that can name themselves.

`tests/integration/gap-ratchet.test.ts` builds fixtures with `accepted` entries; those become kinded, and its self-check still asserts this workspace passes.

## Acceptance

- An admission names its kind, and one that does not is refused. `kotta gap` accepts `structural:`, `unexamined:` and `unimplemented:` entries, and fails on an `accepted` entry that names none of them, saying which kinds it may choose from.
- The report counts the three apart. The summary line carries a count per kind rather than one total, and each admission is listed under its own kind with its reason.
- This workspace's inherited admissions carry a kind, and the bulk assignment says it was made by form. Every node admitted on 2026-08-23 is `structural` or `unexamined`, none is `unimplemented`, and the structural reasons state that the kind follows from the node's form rather than from examining that node.
- The ratchet keeps its force. A node with neither evidence nor an admission still fails the command, unchanged by the kinds.

## Verification

- `run: npx vitest run tests/integration/gap-kinds.test.ts` — the new suite.
- `run: npm test` — the full suite.
