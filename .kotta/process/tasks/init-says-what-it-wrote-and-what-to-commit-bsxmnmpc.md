---
id: T-01m14enxw9tbbgv2kbbsxmnmpc
title: Init says what it wrote and what to commit
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
  - BR-01m0f0wn89r5np2yce79y2pctq
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-28'
updated_at: '2026-08-28'
coverage:
  'A run of init names everything it wrote and calls on the operator to commit it, so the refusal that follows an uncommitted init is never the first the operator hears of it.':
    - BR-01m0f0wn89r5np2yce79y2pctq
  'Init still commits nothing, and every mutation after it still commits the canonical state it writes.':
    - BR-01m0f0wn89r5np2yce79y2pctq
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 6acc6e60999c3e5e3303375415e7566ff78dd61e
---
# T-01m14enxw9tbbgv2kbbsxmnmpc — Init says what it wrote and what to commit

## Outcome

After `kotta init` a fresh repository has `.gitattributes`, `.gitignore`, `.kotta/` and — since
the project file is now created where there is none — `AGENTS.md`, all untracked. The next command
that checks the working tree refuses over files Kotta created seconds earlier: the pattern batch was
repaired for on the same morning (F-01m0zn0d24hjbva47xdp1kb6m1).

`D-01m14dvygt52rpywdv818s5pe0` settled how: init keeps writing rather than committing, because what
it produces is a workspace nobody has agreed to yet and it enters the project's history when its
operator puts it there, having looked. What changes is that the run **says so** — it names what it
wrote and asks.

## Scope

- The closing line of `kotta init`, naming what it wrote.
- The rule, so the asymmetry between init and every later command is stated rather than silent.

## Non-goals

- Making init commit anything, which the decision refused in both halves — the project's own file
  and the workspace Kotta created.
- The per-file prompts that preceded this: one closing line that names everything beats three
  warnings scattered through the output.

## Acceptance

- A run of init names everything it wrote and calls on the operator to commit it, so the refusal that follows an uncommitted init is never the first the operator hears of it.
- Init still commits nothing, and every mutation after it still commits the canonical state it writes.

## Verification

- run: npx vitest run tests/integration/sync.test.ts -t "calls on the operator to commit it"
- run: npx vitest run --reporter dot

## Constraints

- The line names what this run actually wrote, never a fixed list: a project that already had an
  AGENTS.md is not told to commit one.

## Open decisions

None.

## Execution notes

The implementation preceded this task, and that was an error of mine rather than a shortcut worth
keeping: the work was built on top of T-01m14a4q1r5c8qfjrq9q1p6zw2 after that task had already been
submitted for review, so its recorded evidence no longer described the change. Reopening a submitted
task is a human gate and the operator was away, so the work is recorded here instead, with the
sequence stated. The code, the rule and the test all landed before this file existed.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A run of init names everything it wrote and calls on the operator to commit it, so the refusal that follows an uncommitted init is never the first the operator hears of it. | run: npx vitest run tests/integration/sync.test.ts -t "calls on the operator to commit it" — verified: exit 0 at d7102cd |
| Init still commits nothing, and every mutation after it still commits the canonical state it writes. | run: npx vitest run tests/integration/batch-control-state.test.ts — verified: exit 0 at d7102cd |

### Verification performed

A run of init names everything it wrote and calls on the operator to commit it, so the refusal that follows an uncommitted init is never the first the operator hears of it.: run: npx vitest run tests/integration/sync.test.ts -t "calls on the operator to commit it"
Init still commits nothing, and every mutation after it still commits the canonical state it writes.: run: npx vitest run tests/integration/batch-control-state.test.ts

### Deviations

The implementation preceded the task. The work was built on top of T-01m14a4q1r5c8qfjrq9q1p6zw2 after that task had been submitted for review, which left its recorded evidence no longer describing the change; reopening a submitted task is a human gate and the operator was away. Recorded here with the sequence stated rather than presented as ordinary execution. Nothing else was carried out under this task.

### Observations created

Not declared.

### Known concerns

Not declared.
