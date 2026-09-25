---
id: T-01m16e7jx4e1pfj2gefvj6e0xc
title: 'The specification has a view of its own, and the derivation chain names it'
status: done
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
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  - BR-01m0swjgrreeby1pyfdzf4mf7d
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-29'
updated_at: '2026-08-29'
coverage:
  'The specification is a destination of its own: every node is reachable without a task that happens to name it, grouped by the form that declares it.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'The derivation chain the rail names is the chain the product runs: the specification stands between what was noticed and what is executed.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  'The three admission kinds are counted and filtered apart, never as one total, because they ask for opposite work.':
    - BR-01m0swjgrreeby1pyfdzf4mf7d
  'A node shows the edges it answers and the ones that answer it, each named by title and opening the node it names.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: d83bef5ab3b4806c809238315be645acde59e5a5
resolution: completed
approved_by: cli
approved_at: '2026-08-29T11:04:52.461Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

The first wave made the specification legible where a task is read. It gave it no way in of its own:
141 nodes are reachable only through a task that happens to name them, and the rail still calls the
flow *Derivation chain: 01 Observations · 02 Tasks · 03 Batches* when the chain the product runs is
observations → specification → tasks. `amend-spec` is the primary constructive disposition, the
coverage gate is what makes a task defined, and the middle term is the one the board omits.

The admissions are the other half. 141 nodes carry them, and the operator's standing question about
them — *do we keep these promises?* — has no surface at all. They are already kinded apart because
the three ask for opposite work; on the board they are not shown at all.

## Scope

- A specification destination in the rail, in the chain's true position, with the numbering that follows.
- A listing of every node grouped by its form, filterable by form and by admission kind, searchable by title.
- The admission split, counted apart.
- The node's own edges, both directions, named and openable.

## Non-goals

- Computing the gap report in the board. Evidence is a scan of every file in the repository, which is
  `kotta gap`'s work; the board shows what the node itself records — its admission — and who executes it.
- Editing, drafting or landing a node. The board stays read-only.
- The forms themselves as a browsable registry; a form is a grouping here, not a page.

## Acceptance

- The specification is a destination of its own: every node is reachable without a task that happens to name it, grouped by the form that declares it.
- The derivation chain the rail names is the chain the product runs: the specification stands between what was noticed and what is executed.
- The three admission kinds are counted and filtered apart, never as one total, because they ask for opposite work.
- A node shows the edges it answers and the ones that answer it, each named by title and opening the node it names.

## Verification

- run: npx vitest run tests/ui/spec-view.test.tsx
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- No form and no edge name is compiled into the board: both come from the registry the workspace
  carries, so a project's own form is listed and traversed with nothing added here.
- A count is never written into a test or a heading; the split is derived from what was read.

## Open decisions

None.

## Execution notes

The operator asked for this half after seeing the first: "a spec nincs is rajta" was answered by
making it legible where a task is read, and the answer's own known concern was that it still had no
way in.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The specification is a destination of its own: every node is reachable without a task that happens to name it, grouped by the form that declares it. | run: npx vitest run tests/ui/spec-view.test.tsx -t "without a task that names it\|finds one by title\|opens the node a row names" — verified: exit 0 at a1affdf |
| The derivation chain the rail names is the chain the product runs: the specification stands between what was noticed and what is executed. | run: npx vitest run tests/ui/spec-view.test.tsx tests/ui/rail.test.tsx -t "between what was noticed\|derivation chain with its numbers" — verified: exit 0 at a1affdf |
| The three admission kinds are counted and filtered apart, never as one total, because they ask for opposite work. | run: npx vitest run tests/ui/spec-view.test.tsx -t "admission kinds apart\|kind an admission names" — verified: exit 0 at a1affdf |
| A node shows the edges it answers and the ones that answer it, each named by title and opening the node it names. | run: npx vitest run tests/ui/spec-view.test.tsx -t "place in the graph" — verified: exit 0 at a1affdf |

### Verification performed

The specification is a destination of its own: every node is reachable without a task that happens to name it, grouped by the form that declares it.: run: npx vitest run tests/ui/spec-view.test.tsx -t "without a task that names it|finds one by title|opens the node a row names"
The derivation chain the rail names is the chain the product runs: the specification stands between what was noticed and what is executed.: run: npx vitest run tests/ui/spec-view.test.tsx tests/ui/rail.test.tsx -t "between what was noticed|derivation chain with its numbers"
The three admission kinds are counted and filtered apart, never as one total, because they ask for opposite work.: run: npx vitest run tests/ui/spec-view.test.tsx -t "admission kinds apart|kind an admission names"
A node shows the edges it answers and the ones that answer it, each named by title and opening the node it names.: run: npx vitest run tests/ui/spec-view.test.tsx -t "place in the graph"

### Deviations

One line beyond the stated Scope: the CLI fallback sheet gained a 'specification' group naming 'kotta spec new <form> --title'. A reader standing on a specification view with no way to learn how a node is made would meet the same gap this wave exists to close, and the board's command guard covers the new line like every other.

### Observations created

Not declared.

### Known concerns

The admission counts are what each node records, not what 'kotta gap' concludes: gap lists only nodes without evidence, so its structural and unexamined totals are smaller. Both numbers are honest and they answer different questions, and nothing on the board says which one a reader is looking at.
