---
id: T-024
title: 'Entitás nyitott kérdései: első osztályú lista ticketen, package-en, findingon'
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
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-26'
spec:
  - BR-01m0z873stwx7szg5896gwsbry
  - EX-01m0z873t1cmhybhakq6vwzxb6
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
  - E-01m0f0wn898ayyrvy613zjx3ye
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
coverage:
  'An entity''s open questions are enumerated from its own text: three questions marked in a task are listed as exactly three, each with the position that addresses it and the text it asks, and a task whose section denies any is listed as none.':
    - BR-01m0z873stwx7szg5896gwsbry
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'A question naming an existing decision is answered: it is reported resolved with that decision, it does not block defining, and it stays where it stood rather than being removed. An unresolved question refuses defining naming which positions are still open.':
    - BR-01m0z873stwx7szg5896gwsbry
    - EX-01m0z873t1cmhybhakq6vwzxb6
    - E-01m0f0wn898ayyrvy613zjx3ye
  'The workspace-wide listing gathers from every entity kind whose form carries the section, groups by entity, and puts the questions that block defining before the rest.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'The board shows an entity''s open questions as their own panel, and selecting one carries the reader to where that question is written in the entity.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'Kotta''s own workspace is the migration proof: every entity that exists today validates exactly as it did before, because a section that denies open questions is the empty enumeration and no entity is rewritten to gain the feature.':
    - BR-01m0z873stwx7szg5896gwsbry
    - E-01m0f0wn898ayyrvy613zjx3ye
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 36d01e4301504bb587469e4ace7d45310cba847b
---
# T-024 — Entitás nyitott kérdései: első osztályú lista ticketen, package-en, findingon

## Outcome

An entity's undecided points stop being prose and become a list you can work through. `kotta questions <id>` answers what still waits on a human in one entity; `kotta questions` answers it for the whole workspace, grouped by entity, blocking ones first. The same enumeration is what the defining gate reads, so the answer to "why won't this define" stops being "something in Open decisions" and becomes "Q2 and Q3, and here is what they ask". The board shows the same list as a panel on the entity and carries the reader to where each question is written.

Today the gate is all-or-nothing in both directions: `Open decisions` either matches the literal denial `None.`/`N/A`/`No open decisions` (`src/core/validation.ts:59-62`) or the whole task is refused, with no way to say which point is the one still open, no way to count questions, and no way to see them anywhere but by re-reading the entity. A question that has in fact been decided — as `EX-01m0f0wn8a7jvak9k4pkxxyg0m` already describes, with a decision record — can only pass the gate by being deleted, which throws away the reasoning that made the answer make sense.

## Scope

- **Marking.** A question is an item under the entity's `Open decisions` heading. It is addressed by the entity and its position in that list (`T-024/Q2`). It is resolved by naming a decision record that exists in the workspace; the resolved item stays in place.
- **Parse.** One reader, shared by the gate, both surfaces and the board, so the four never disagree about what an entity is asking.
- **Gate.** `validation.ts` reads the enumeration instead of the denial regex: no questions passes, every question resolved passes, an unresolved question is refused naming its position and its text.
- **CLI.** `kotta questions [<id>] [--json]`, declared once in the operation registry and projected to both surfaces.
- **MCP.** `workspace_questions`, the same service.
- **Board.** An open-questions panel in the entity drawer, each question linking to the section it is written in.

## Non-goals

- Not a new entity kind. A question lives in the text of the entity it belongs to; it gets no id of its own, no file, no lifecycle.
- Not a comment thread. The question is the entity's state, not a conversation about it.
- Not a sweep category. `T-019`'s `waiting-on-you` could read this later; wiring it is not this task, as the capture already says.
- Not a migration. No existing entity is rewritten, and none has to adopt the marking to keep validating.

## Acceptance

- An entity's open questions are enumerated from its own text: three questions marked in a task are listed as exactly three, each with the position that addresses it and the text it asks, and a task whose section denies any is listed as none.
- A question naming an existing decision is answered: it is reported resolved with that decision, it does not block defining, and it stays where it stood rather than being removed. An unresolved question refuses defining naming which positions are still open.
- The workspace-wide listing gathers from every entity kind whose form carries the section, groups by entity, and puts the questions that block defining before the rest.
- The board shows an entity's open questions as their own panel, and selecting one carries the reader to where that question is written in the entity.
- Kotta's own workspace is the migration proof: every entity that exists today validates exactly as it did before, because a section that denies open questions is the empty enumeration and no entity is rewritten to gain the feature.

## Verification

- run: npx vitest run tests/unit/questions.test.ts
- run: npx vitest run tests/unit/gate-surfaces.test.ts tests/unit/validation.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck
- run: npx playwright test --config site/playwright.config.ts

## Constraints

- The marking stays plain markdown: readable in a git diff, writable by hand, and it is the same section the form already requires — no new heading, no frontmatter list.
- Opt-in, not migration: an entity with no marked question is the empty enumeration, and every entity in this repository must keep validating untouched.
- One parse. If the gate and the listing can disagree about what an entity asks, the feature is worse than the prose it replaces.
- The position addresses the list as it reads now. Answering a question never moves another, because answered questions stay; writing a new question above an existing one does move it, and the report says so rather than promising a permanence the format cannot give.

## Open decisions

None.

## Execution notes

The capture's fifth acceptance condition named a `crm-kit` workspace as the real proof. That workspace does not exist in this repository and never has; the honest equivalent is this one, so the condition was replaced by the migration proof over Kotta's own entities. The rest of the capture is carried as written.

The capture asks for a "stable" position. Document order is what a plain-markdown format can give, and it is stable against the operation that matters — answering, since answered questions stay in place. That limit is stated in the constraint rather than papered over.
