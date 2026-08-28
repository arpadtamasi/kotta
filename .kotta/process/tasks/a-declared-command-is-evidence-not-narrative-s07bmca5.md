---
id: T-01m14khqarazb07kcss07bmca5
title: 'A declared command is evidence, not narrative'
status: active
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - UC-01m0f0wn89dy38s6whbfa0jafn
  - BR-01m0m33yxt2vqxb3jvqc186ssy
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'A declared command is not scanned as narrative: an evidence line whose run: command names a test file or filter about deviations does not make the task confess to one.':
    - BR-01m0m33yxt2vqxb3jvqc186ssy
    - UC-01m0f0wn89dy38s6whbfa0jafn
  'Prose evidence is still scanned, and the case F-019 exists for still fails: a narrative admitting a deviation beside a denying field is refused and quoted.':
    - UC-01m0f0wn89dy38s6whbfa0jafn
  'This workspace validates, including the two tasks whose own subject is deviations.':
    - UC-01m0f0wn89dy38s6whbfa0jafn
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 68b4badabd2d550156d0fe7abc323d60755cf326
---
# T-01m14khqarazb07kcss07bmca5 — A declared command is evidence, not narrative

## Outcome

`kotta validate` is red again, against the task that fixed the previous instance of this. Its
evidence line is:

```
<acceptance condition>: run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "own subject is deviations"
```

The fix landed hours earlier strips the acceptance condition, correctly. What remains is the
`run:` command — which names a test file and a filter about deviations, because that is what the
test is about.

A declared command is machine evidence: it is executed at submission and receipted with its exit
status (BR-01m0m33yxt2vqxb3jvqc186ssy). It is not the agent's account of the run, and the account
is what F-019's check reads. Scanning a command for confessions reads a filename as a statement.

## Scope

- What `DEVIATION_MISMATCH` scans within an evidence line: the prose, not the declared command.

## Non-goals

- The check's purpose, its vocabulary, or its refusal, all unchanged.
- The acceptance-condition stripping landed earlier, which stays and is still needed.

## Acceptance

- A declared command is not scanned as narrative: an evidence line whose run: command names a test file or filter about deviations does not make the task confess to one.
- Prose evidence is still scanned, and the case F-019 exists for still fails: a narrative admitting a deviation beside a denying field is refused and quoted.
- This workspace validates, including the two tasks whose own subject is deviations.

## Verification

- run: npx vitest run tests/integration/deviation-reconciliation.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The boundary is the declared-command marker the review machinery already writes, not a guess at
  where prose ends.

## Open decisions

None.

## Execution notes

The previous fix was right about where the false positive came from and incomplete about how far it
reached. The case that proves it is the task that made it, which is the shortest possible feedback
loop and the reason it was found within the hour.
