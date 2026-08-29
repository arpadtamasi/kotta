---
id: T-01m165x8k9vwg5160eykprv97p
title: 'The board shows the agreement, not only its execution'
status: defined
origin: human
types:
  - feature
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
  - BR-01m0f0wn89c50fe1mz5yn1nw85
branch: null
pull_request: null
created_at: '2026-08-29'
updated_at: '2026-08-29'
coverage:
  'The board reads the specification: every node of every registered form is in what it serves, and the forms come from the registry rather than from a list in code.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'A task names the accepted nodes it executes and the map from each acceptance condition to the nodes that carry it, where the task is read.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'Every specification reference the board shows is named by its title and opens the node itself, including the ones an amend-spec observation names.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
    - BR-01m0f0wn89c50fe1mz5yn1nw85
  'An opened node shows what it promises and what leans on it: its form, its file, its admission as written, its sections, and the tasks that execute it.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
---
## Outcome

The operator opened the board and said: *"De a spec nincs is rajta."*

Measured: `src/commands/ui.ts` contained no occurrence of `spec`. The board's data layer never
opened `.kotta/spec/`, so 141 nodes across 11 forms were absent. The board's `Task` type carried
neither `spec` nor `coverage` — the coverage gate is what lets a task become defined, and the one
visual surface was silent on it. The single trace of the specification anywhere was the observation
drawer printing bare ids for an `amend-spec` disposition: no title, nothing to open.

The payload already carried the task's own `spec` and `coverage`; the view had simply never
declared or rendered them. What was missing was the nodes themselves, and the reading of what was
already there.

## Scope

- The board reads the specification through the form registry, from the same base ref as everything else.
- The task's own references and its coverage map, shown with the brief.
- A specification reference named by title and opening its node; the node's own drawer.
- The reverse edge a reader wants on opening a node: which tasks execute it.

## Non-goals

- A specification view of its own — forms, listings, edges, the gap report. That is the second wave,
  and this one is what makes the first wave's absence stop misleading.
- Writing anything. The board stays read-only.
- The specification's own edges between nodes; only the task-to-node direction is shown here.

## Acceptance

- The board reads the specification: every node of every registered form is in what it serves, and the forms come from the registry rather than from a list in code.
- A task names the accepted nodes it executes and the map from each acceptance condition to the nodes that carry it, where the task is read.
- Every specification reference the board shows is named by its title and opens the node itself, including the ones an amend-spec observation names.
- An opened node shows what it promises and what leans on it: its form, its file, its admission as written, its sections, and the tasks that execute it.

## Verification

- run: npx vitest run tests/ui/board-spec.test.tsx
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- No specification prefix is compiled into the board: a project's own form declares its own prefix,
  so a minted id is recognised by shape and resolved by lookup, and one that resolves to nothing
  renders exactly as it does today.

## Open decisions

None.

## Execution notes

Implementation began before this task existed — the operator's report was answered at the keyboard
and the claim came after. Declared at review rather than tidied away.
