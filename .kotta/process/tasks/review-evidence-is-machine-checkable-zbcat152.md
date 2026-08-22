---
id: T-01m0jdnswngt3tcdtbzbcat152
title: Review evidence is machine-checkable
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
  - BR-01m0m33yxt2vqxb3jvqc186ssy
  - EX-01m0m33yxvyppm683xrd5tk8f3
  - UC-01m0f0wn89dy38s6whbfa0jafn
branch: claude/graft-kottara-837884
pull_request: claude/graft-kottara-837884
created_at: '2026-08-21'
updated_at: '2026-08-22'
coverage:
  'An evidence entry declaring `run: <command>` is executed at review submission in the task''s execution checkout, and the recorded evidence carries the command, the commit it ran on, and exit 0.':
    - BR-01m0m33yxt2vqxb3jvqc186ssy
    - UC-01m0f0wn89dy38s6whbfa0jafn
  A declared check that exits non-zero refuses the whole submission naming the check and the exit code; the task stays active with its claim and nothing is written to the review evidence.:
    - BR-01m0m33yxt2vqxb3jvqc186ssy
    - EX-01m0m33yxvyppm683xrd5tk8f3
  'Prose evidence entries submit exactly as before, and declared and prose entries mix freely in one submission.':
    - BR-01m0m33yxt2vqxb3jvqc186ssy
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 58507dd5eb6bbc0d824cbbbeeaad809f8bb135b5
resolution: completed
approved_by: cli
approved_at: '2026-08-22T09:08:13.090Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

A review submission can prove its own claims: an evidence entry that declares a runnable check is
executed at submission time, a failure refuses the submission, and a success is recorded as a
receipt — command, commit, exit status — next to the evidence. Narrated-but-never-run evidence
stops being possible for declared checks.

## Scope

The review evidence core (`src/core/review-evidence.ts`) learns to recognise a `run:`-prefixed
evidence value; the review path (`reviewTask` in `src/commands/task.ts`) executes each declared
command in the task's execution root before anything is written, refuses on non-zero exit, and
renders the receipt into the review evidence table. The MCP `task_review` tool flows through the
same core unchanged. Integration tests cover the refused and the recorded path; docs name the
syntax where review evidence is documented (README CLI overview, submit-review skill).

## Non-goals

No re-run at close and no re-run anywhere later — the receipt records one real run. No sandboxing
or command policy: the declared command runs exactly as the operator's environment runs commands.
No `kotta gap` integration and no board changes in this task. No change to the batch surface or to
prose evidence semantics, including the duplicated-evidence refusal.

## Acceptance

- An evidence entry declaring `run: <command>` is executed at review submission in the task's execution checkout, and the recorded evidence carries the command, the commit it ran on, and exit 0.
- A declared check that exits non-zero refuses the whole submission naming the check and the exit code; the task stays active with its claim and nothing is written to the review evidence.
- Prose evidence entries submit exactly as before, and declared and prose entries mix freely in one submission.

## Verification

- Integration tests: a task submitted with a passing declared check lands in review with the
  command, commit and `exit 0` recorded in its evidence table; the same submission with a failing
  command is refused naming the check and exit code, and the task file is byte-identical afterwards.
- A mixed submission (one `run:` entry, one prose entry) passes and records only the declared one
  as a receipt.
- The full vitest suite and typecheck stay green.

## Constraints

The declared command runs with the execution root as its working directory. The refusal happens
before any write, so a failed submission leaves the task file untouched. The `run:` prefix is the
whole surface — no new flags, no second evidence vocabulary.

## Open decisions

None.

## Execution notes

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| An evidence entry declaring `run: <command>` is executed at review submission in the task's execution checkout, and the recorded evidence carries the command, the commit it ran on, and exit 0. | run: npx vitest run tests/integration/review-machine-evidence.test.ts — verified: exit 0 at c7e51e1 |
| A declared check that exits non-zero refuses the whole submission naming the check and the exit code; the task stays active with its claim and nothing is written to the review evidence. | the refusal test asserts exit 1 naming the check and 'exited with 3', state active, and a byte-identical task file afterwards |
| Prose evidence entries submit exactly as before, and declared and prose entries mix freely in one submission. | the receipt test submits one run: entry and one prose entry together; the prose row is recorded without a verified suffix, and the pre-existing review-evidence suites pass unchanged |

### Verification performed

An evidence entry declaring `run: <command>` is executed at review submission in the task's execution checkout, and the recorded evidence carries the command, the commit it ran on, and exit 0.: run: npx vitest run tests/integration/review-machine-evidence.test.ts
A declared check that exits non-zero refuses the whole submission naming the check and the exit code; the task stays active with its claim and nothing is written to the review evidence.: the refusal test asserts exit 1 naming the check and 'exited with 3', state active, and a byte-identical task file afterwards
Prose evidence entries submit exactly as before, and declared and prose entries mix freely in one submission.: the receipt test submits one run: entry and one prose entry together; the prose row is recorded without a verified suffix, and the pre-existing review-evidence suites pass unchanged

### Deviations

None.

### Observations created

None.

### Known concerns

The declared command runs unsandboxed and without a timeout, exactly as the operator's environment runs commands - stated in the business rule's scope.
