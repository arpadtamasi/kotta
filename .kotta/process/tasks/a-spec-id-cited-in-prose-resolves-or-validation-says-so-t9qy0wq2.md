---
id: T-01m1a4r3qecdg0z4s0t9qy0wq2
title: 'A spec id cited in prose resolves, or validation says so'
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
  - UC-01m0f0wn89ny7vx515ke3ksnra
branch: >-
  feat/T-01m1a4r3qecdg0z4s0t9qy0wq2-a-spec-id-cited-in-prose-resolves-or-validation-says-so
pull_request: null
created_at: '2026-08-30'
updated_at: '2026-08-30'
coverage:
  'A specification id written into a spec node prose that names nothing in the workspace fails validation, which says which file, which id, and which section it stands under.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
  'A citation that resolves is silent, and resolving means either a specification node or a decision record: the 141 landed nodes still validate, the five that cite decisions included.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
  'What counts as a citation comes from the form registry, so a newly registered form is read the day it is registered and no list in the code has to be edited.':
    - UC-01m0f0wn89ny7vx515ke3ksnra
assigned_agent: claude
worktree: .worktrees/T-01m1a4r3qecdg0z4s0t9qy0wq2
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 35abdc5ee9e5f4bd368b6937640b6e2d69f7c2a4
review_commit: 989a5fdcd9dd7ac3a2ccef6c091965cf59ee3072
---
# T-01m1a4r3qecdg0z4s0t9qy0wq2 — A spec id cited in prose resolves, or validation says so

## Outcome

The specification promises that "a specification id written into a node's text is a citation, and a
citation that resolves to nothing is a broken reference wherever it stands". Nothing reads prose.
`validateSpecWorkspace` checks frontmatter edges — `SPEC_NODE_DANGLING_EDGE` — and stops there, and
`kotta gap` reads ids out of source files, never out of the specification.

Replayed on 2026-08-30: adding `(see BR-01m0zzzzzzzzzzzzzzzzzzzzzz)` to the prose of a landed use
case left `kotta validate` reporting "completed" and `kotta gap` unchanged. That is the exact shape
of the mistyped business-rule id that landed green on 2026-08-28 and was found by reading.

A broken citation is worse than no citation, because it reads as an answer: it points a reader at a
node that does not exist, and it survives every check the workspace runs.

## Scope

- Reading the prose of every specification node for ids that carry a registered form prefix or the
  decision prefix, and reporting each one that resolves to nothing.
- The reading comes from the form registry, beside the edge checks that already use it.
- `kotta validate` refuses the workspace on such a citation, as it does for a dangling edge.

## Non-goals

- Task and observation prose. Their citations reach the specification through the coverage gate,
  which is checked; prose beyond it is a different promise, in a different node, and widening this
  to reach it would make the change untestable against the sentence it executes.
- A spec node naming a task in prose. The direction rule is enforced on frontmatter today
  (`SPEC_REFERENCES_TASK`); extending it to prose is its own promise, not this one.
- Rewriting or repairing any citation. This reports; a human corrects.
- The five decision citations that stand today. They resolve, and they must stay silent — that is
  an acceptance condition here, not work.

## Acceptance

- A specification id written into a spec node prose that names nothing in the workspace fails validation, which says which file, which id, and which section it stands under.
- A citation that resolves is silent, and resolving means either a specification node or a decision record: the 141 landed nodes still validate, the five that cite decisions included.
- What counts as a citation comes from the form registry, so a newly registered form is read the day it is registered and no list in the code has to be edited.

## Verification

- run: npx vitest run tests/integration/spec-prose-citation.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- One reading of what an id looks like. The frontmatter checks, the prose check and the id minting
  already share the registry's prefix and Crockford body; a second spelling of that pattern would
  eventually disagree with the first, silently.
- Reported, never repaired. The check writes nothing.
- A citation inside a fenced code block is still a citation here: the specification has no fenced
  example ids today, and treating fences as exempt would create a place to hide a broken reference.

## Open decisions

None.

## Execution notes

The check belongs in `src/spec/registry.ts`, in `validateSpecWorkspace`, where `ids` — the map of
every node id to its path — is already built. Decision ids are read from
`.kotta/process/decisions/`. The new issue code sits beside `SPEC_NODE_DANGLING_EDGE`; name it for
prose rather than for edges, so the two are distinguishable in a report.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A specification id written into a spec node prose that names nothing in the workspace fails validation, which says which file, which id, and which section it stands under. | run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "an id naming nothing fails validation" — verified: exit 0 at 989a5fd |
| A citation that resolves is silent, and resolving means either a specification node or a decision record: the 141 landed nodes still validate, the five that cite decisions included. | run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "is silent, including a node citing itself\|resolves against the decision records\|passes the check it now runs" — verified: exit 0 at 989a5fd |
| What counts as a citation comes from the form registry, so a newly registered form is read the day it is registered and no list in the code has to be edited. | run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "comes from the registry\|longer prefix is never read" — verified: exit 0 at 989a5fd |

### Verification performed

A specification id written into a spec node prose that names nothing in the workspace fails validation, which says which file, which id, and which section it stands under.: run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "an id naming nothing fails validation"
A citation that resolves is silent, and resolving means either a specification node or a decision record: the 141 landed nodes still validate, the five that cite decisions included.: run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "is silent, including a node citing itself|resolves against the decision records|passes the check it now runs"
What counts as a citation comes from the form registry, so a newly registered form is read the day it is registered and no list in the code has to be edited.: run: npx vitest run tests/integration/spec-prose-citation.test.ts -t "comes from the registry|longer prefix is never read"

### Deviations

None.

### Observations created

Not declared.

### Known concerns

Task and observation prose is still unread, by the non-goal the definition states: their citations reach the specification through the coverage gate. A spec node naming a task in prose is likewise still only refused in frontmatter. Both are separate promises. The fixture premise is asserted rather than assumed: the beforeEach refuses to run a case unless the three-node workspace validates clean first, so the exit-code claim says something about the citation and not about the fixture.
