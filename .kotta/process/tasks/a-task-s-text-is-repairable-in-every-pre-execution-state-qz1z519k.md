---
id: T-01m0jdntgw2z8qpy6wqz1z519k
title: A task's text is repairable in every pre-execution state
status: done
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
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  - EX-01m0mzvcvdvxzpr59p8v7387n3
branch: claude/graft-kottara-837884
pull_request: claude/graft-kottara-837884
created_at: '2026-08-21'
updated_at: '2026-08-22'
coverage:
  '`kotta task define <id> --draft --from <file>` stores or amends a backlog task''s text with its structure validated and no coverage required, and the task stays in backlog.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
    - EX-01m0mzvcvdvxzpr59p8v7387n3
  '`--draft` on a task that has left backlog is refused, and a definition submitted without `--draft` still requires every acceptance condition to cite a landed specification node.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
    - EX-01m0mzvcvdvxzpr59p8v7387n3
  A changed title in a draft renames the stored file within process/tasks/.:
    - EX-01m0mzvcvdvxzpr59p8v7387n3
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 9b088c20a1c62a197718e0f30e18b7a774c9726f
resolution: completed
approved_by: cli
approved_at: '2026-08-22T16:31:46.791Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

A captured task's text is iterated through the CLI instead of by hand-editing the stored file:
`task define --draft` stores or amends a backlog capture with its structure validated and no
coverage demanded, while the coverage gate stays exactly where executability begins — at the
backlog → defined transition.

## Scope

`defineTask` in `src/commands/task.ts` gains a draft option: allowed only while the task is in
backlog, targets backlog, validates the definition structure, skips the coverage check, and
records its own lifecycle event. The CLI `task define` command and the MCP `task_define` tool
expose the flag. Integration tests pin the three acceptance conditions; the README CLI overview,
the define-task skill and the CHANGELOG name the flag.

## Non-goals

No change to the coverage gate at backlog → defined or to defined-state amendment, which stays at
full definition strength. No repair path for active or later states. No relaxation of the
structural validation — a draft still carries every required section. No new command: `--draft`
is a mode of `define`.

## Acceptance

- `kotta task define <id> --draft --from <file>` stores or amends a backlog task's text with its structure validated and no coverage required, and the task stays in backlog.
- `--draft` on a task that has left backlog is refused, and a definition submitted without `--draft` still requires every acceptance condition to cite a landed specification node.
- A changed title in a draft renames the stored file within process/tasks/.

## Verification

- Integration tests: a default-gate workspace drafts a capture with corrected text and a new
  title (file renamed, status backlog, no coverage error); the same definition without `--draft`
  is refused with ACCEPTANCE_NOT_COVERED; `--draft` on a defined task is refused by name.
- The full vitest suite and typecheck stay green.

## Constraints

The tmp+rename write pattern and the retitle-collision refusal are kept. A draft records a
lifecycle event distinct from the defining one, so the timeline shows drafting as drafting.

## Open decisions

None.

## Execution notes

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `kotta task define <id> --draft --from <file>` stores or amends a backlog task's text with its structure validated and no coverage required, and the task stays in backlog. | run: npx vitest run tests/integration/task-draft.test.ts — verified: exit 0 at 2d04a3a |
| `--draft` on a task that has left backlog is refused, and a definition submitted without `--draft` still requires every acceptance condition to cite a landed specification node. | the 'refused by name' test asserts exit 1 with '--draft amends a captured task' on a defined task, and the gate test asserts ACCEPTANCE_NOT_COVERED for the identical definition without --draft |
| A changed title in a draft renames the stored file within process/tasks/. | the store test drafts with title 'Draft me properly' and asserts the old path is gone and the stored file is process/tasks/draft-me-properly-*, status backlog |

### Verification performed

`kotta task define <id> --draft --from <file>` stores or amends a backlog task's text with its structure validated and no coverage required, and the task stays in backlog.: run: npx vitest run tests/integration/task-draft.test.ts
`--draft` on a task that has left backlog is refused, and a definition submitted without `--draft` still requires every acceptance condition to cite a landed specification node.: the 'refused by name' test asserts exit 1 with '--draft amends a captured task' on a defined task, and the gate test asserts ACCEPTANCE_NOT_COVERED for the identical definition without --draft
A changed title in a draft renames the stored file within process/tasks/.: the store test drafts with title 'Draft me properly' and asserts the old path is gone and the stored file is process/tasks/draft-me-properly-*, status backlog

### Deviations

None.

### Observations created

None.

### Known concerns

A structurally broken draft is still refused (MISSING_SECTION) - drafting relaxes coverage only, never the section skeleton; pinned by its own test.
