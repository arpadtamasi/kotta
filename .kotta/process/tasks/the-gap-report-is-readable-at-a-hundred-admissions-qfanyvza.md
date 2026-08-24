---
id: T-01m0t6y6mrz2qv285gqfanyvza
title: The gap report is readable at a hundred admissions
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
  - UC-01m0fpqfxjvet99wbz0v1ag64q
  - BR-01m0swjgrreeby1pyfdzf4mf7d
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-24'
updated_at: '2026-08-24'
coverage:
  'A shared reason is printed once. Admissions carrying identical text are grouped under that text stated a single time, with their titles and ids named beneath it, and adding another node to such a group lengthens the report by one line.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'The spec-delta section names the change, not the admission''s essay. A changed node that is admitted is shown with its kind, not with the whole reason repeated per entry.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
    - BR-01m0swjgrreeby1pyfdzf4mf7d
  'This workspace''s report fits a reading. `kotta gap` on the current workspace prints under a hundred lines, and no sentence in it appears more than three times.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  '`--json` loses nothing. Every admission still carries its own full reason in the machine-readable form, and the counts per kind are unchanged.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
    - BR-01m0swjgrreeby1pyfdzf4mf7d
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 2a0950765a9b08c04bbcdb64550a3d58571f4b22
---
## Outcome

`kotta gap` is what the use case says it is — the input to defining tasks. Today, at 1ce7c7a, it prints 333 lines and 122,078 characters, and one sixty-word paragraph appears 108 times, because the bulk admission wording was written for a single node and never read back against a hundred. The summary line is right and the sections are right; the body is a wall, and a wall is read once and then skipped.

A measure that is not read fails the same way as one that lies. That is not a new agreement — it is what "the report is the input to defining tasks" already promises, and this is a defect against it.

## Scope

- Admissions sharing identical reason text are grouped: the reason once, the nodes named beneath.
- The `Latest accepted spec delta` section shows a changed admitted node by its kind rather than reprinting the reason.
- `--json` is untouched: every entry keeps its own reason, and the counts per kind stay as they are.

## Non-goals

- Changing what is counted, or any kind's meaning. The numbers on the summary line must come out identical before and after.
- Truncating or eliding a reason. A reason is either shown in full or shown once for its group; nothing is cut mid-sentence.
- Reformatting the other reports. `status` and `batch status` are not this defect.

## Constraints

Grouping is by exact reason text, not by kind: two nodes admitted individually with different reasons stay individual even when their kind matches, because the reason is what the reader needs.

The summary line stays first and unchanged, so a reader who stops after four lines still has every number.

## Open decisions

None.

## Execution notes

`formatGapReport` in `src/commands/gap.ts` builds both the delta section and the per-kind sections; the repetition is in `- ${title} · ${id} — ${reason}` and in the delta's `admitted as ${kind}: ${reason}`.

The bulk admissions differ only by the node they sit on, so exact-text grouping collapses them into two groups — one structural, one unexamined — and leaves any individually written admission alone.

## Acceptance

- A shared reason is printed once. Admissions carrying identical text are grouped under that text stated a single time, with their titles and ids named beneath it, and adding another node to such a group lengthens the report by one line.
- The spec-delta section names the change, not the admission's essay. A changed node that is admitted is shown with its kind, not with the whole reason repeated per entry.
- This workspace's report fits a reading. `kotta gap` on the current workspace prints under a hundred lines, and no sentence in it appears more than three times.
- `--json` loses nothing. Every admission still carries its own full reason in the machine-readable form, and the counts per kind are unchanged.

## Verification

- `run: npx vitest run tests/integration/gap-readability.test.ts` — the new suite.
- `run: npm test` — the full suite.
