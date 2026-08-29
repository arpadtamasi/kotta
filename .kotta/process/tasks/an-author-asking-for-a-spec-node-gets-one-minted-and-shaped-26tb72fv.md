---
id: T-01m0jkmvpprxkh1x0526tb72fv
title: 'An author asking for a spec node gets one, minted and shaped'
status: active
origin: human
types:
  - feature
profiles: []
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89ny7vx515ke3ksnra
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-29'
coverage:
  'An author asking for a node gets a file already carrying its minted id, its declared form, and a section for every heading and a field for every edge the form requires.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
  'An unknown or absent form is refused by naming every form the registry registers, and nothing is written.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
  'The scaffold is a draft, not an agreement: nothing is committed, and the result says that validation now asks the form''s own registered question for each part still unanswered.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: c32895b13b99bde075687c1c307c0ed55532fb92
---
## Outcome

The accepted use case says: *"Identifiers are minted by Kotta, not written by hand: an author asking
for a node gets one already carrying its id and its form's skeleton."*

There is no `kotta spec` command at all. Every one of this workspace's 141 spec nodes was written by
hand, id included — a 26-character Crockford body typed or copied, in a repository whose own rule is
that identifiers are the machine's. The workshop skills draft nodes the same way, so the promise is
unkept on the one surface that could keep it.

## Scope

- `kotta spec new <form> --title "…"`: mint, place and scaffold one node from the registered form.
- What the refusal says when the form is not registered.
- What the result says about the draft it left behind.

## Non-goals

- Editing, listing or showing existing nodes; landing them; and the form registry itself, unchanged.
- Committing. A shaped node becomes the agreement when it lands on the base branch on a human yes,
  which is a different act from writing a draft.
- Filling anything in. The scaffold carries the form's questions, not answers to them.

## Acceptance

- An author asking for a node gets a file already carrying its minted id, its declared form, and a section for every heading and a field for every edge the form requires.
- An unknown or absent form is refused by naming every form the registry registers, and nothing is written.
- The scaffold is a draft, not an agreement: nothing is committed, and the result says that validation now asks the form's own registered question for each part still unanswered.

## Verification

- run: npx vitest run tests/integration/spec-new.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The id body is the one every other minted identifier uses; the prefix comes from the form's own
  registry entry, never from a list compiled in code.
- A destination that already exists is refused rather than overwritten.

## Open decisions

None.

## Execution notes

A scaffold makes `kotta validate` red on its own node, by design: the missing sections and edges are
exactly the form's registered questions, asked where the author will answer them. The result says so
rather than letting the red arrive unexplained.
