---
id: T-01m0pz1ade6qc34aty2kv7gttz
title: What the terminal says is what the result carries
status: review
origin: human
types:
  - defect
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  - EX-01m0pw5bc716gdz5qbb8yv6t2m
  - EX-01m0pw5bc7qdenh5j2pefb13ed
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-23'
updated_at: '2026-08-23'
coverage:
  A failing result prints what failed. Running a command whose result did not succeed names the failure in the human output and exits non-zero; no line reports that the command completed. `kotta validate` on a workspace with invalid nodes names each violated rule and the file holding it.:
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - EX-01m0pw5bc716gdz5qbb8yv6t2m
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'The two renderings never disagree about outcome. For every command, the human output and `--json` report the same success or failure, proven by a test that drives both and compares.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - EX-01m0pw5bc716gdz5qbb8yv6t2m
  'A retired task is named by its resolution. Wherever a task is listed or shown — `task list`, `task show`, and the board — a task that ended at `done` with resolution cancelled, duplicate or obsolete is displayed as that resolution, not as `done`.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - EX-01m0pw5bc7qdenh5j2pefb13ed
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'A batch of retired work does not read as built. `batch status` reports each member''s resolution, so a batch whose members were all cancelled is distinguishable from one whose members were completed.':
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
    - EX-01m0pw5bc7qdenh5j2pefb13ed
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 60bc76e557dd3988b7e712f79604fd403513c0d5
---
## Outcome

Reading Kotta's terminal output tells a human the same thing as reading its JSON. Today it does not, in two ways that were found together and share one cause: the human rendering is written beside the result rather than derived from it.

`kotta validate` prints `kotta validate completed.` and exits 1 — the errors reach only `--json` and `$?`. That is not hypothetical damage: two specification errors stayed red on the base branch from 2026-08-22 across three consecutive review submissions that cited the command as clean. And a task retired by `task cancel` is stored correctly — `status: done`, `resolution: cancelled` — but no listing shows the resolution, so twelve tasks retired in one sweep are indistinguishable from the eighty-nine that were delivered.

## Scope

- The CLI's human rendering of a failed result: the fallback at `src/cli/index.ts:167-174` prints a completed line for any result with no named renderer, regardless of whether the result succeeded. A failing result must render what failed.
- `validate`'s own rendering: each error's code, message and path.
- Task display: `task list`, `task show` and the board show the resolution for a task that ended at `done` with a resolution other than `completed`.
- `batch status`: member resolutions in both the human and JSON forms.
- Tests that drive the built binary in both renderings and compare the outcome they report.

## Non-goals

- Changing what is stored. `status` and `resolution` stay separate fields; this task changes what is shown.
- Changing the lifecycle. A cancelled task still ends at `done` with a resolution; no new state is introduced.
- Reworking the board's layout or density, which is its own task.
- Colour, tables, or any general redesign of the CLI's output.

## Open decisions

None.

## Constraints

The rendering layer is the only place this may be fixed. No service function changes its return value, no stored record changes shape, and no command changes its exit code — those are already correct, and the defect is that the printed line ignores them. The `result` objects already carry `ok`; the fallback must read it.

The surface snapshot in `tests/integration/surface-snapshot.test.ts` pins the shape of `--help`, not of result output, so it should not move; if it does, that is a signal the change reached further than the rendering layer.

## Execution notes

Start at `src/cli/index.ts:167-174`. `humanize` returns a completed line for any result carrying a `command` field with no registered renderer; it never inspects `ok`. Give the failure path its own branch there, so every command inherits it, and register a renderer for `validate` that prints its errors.

For the resolution display, `renderEntityList` and `renderEntityShow` are the two named renderers to change, plus the board's task rendering; the resolution is already in the frontmatter and in the `show --json` payload, so no reader needs to learn a new field.

## Acceptance

- A failing result prints what failed. Running a command whose result did not succeed names the failure in the human output and exits non-zero; no line reports that the command completed. `kotta validate` on a workspace with invalid nodes names each violated rule and the file holding it.
- The two renderings never disagree about outcome. For every command, the human output and `--json` report the same success or failure, proven by a test that drives both and compares.
- A retired task is named by its resolution. Wherever a task is listed or shown — `task list`, `task show`, and the board — a task that ended at `done` with resolution cancelled, duplicate or obsolete is displayed as that resolution, not as `done`.
- A batch of retired work does not read as built. `batch status` reports each member's resolution, so a batch whose members were all cancelled is distinguishable from one whose members were completed.

## Verification

- `run: npx vitest run tests/integration/rendering-fidelity.test.ts` — the new suite: a failing result renders its failure, the two renderings agree, a retired task reads as retired, a retired batch reads as retired.
- `run: npm test` — the full suite, since the rendering change touches every command's output and the existing surface snapshot.
- Manual read-back on this workspace: `kotta task list` distinguishes the twelve tasks retired on 2026-08-23 from the delivered ones, and `kotta batch status P-001` says its members were retired.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A failing result prints what failed. Running a command whose result did not succeed names the failure in the human output and exits non-zero; no line reports that the command completed. `kotta validate` on a workspace with invalid nodes names each violated rule and the file holding it. | run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a failed validation is not printed as completed' — verified: exit 0 at 7bd48fc |
| The two renderings never disagree about outcome. For every command, the human output and `--json` report the same success or failure, proven by a test that drives both and compares. | run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'the human rendering and --json never disagree about the outcome' — verified: exit 0 at 7bd48fc |
| A retired task is named by its resolution. Wherever a task is listed or shown — `task list`, `task show`, and the board — a task that ended at `done` with resolution cancelled, duplicate or obsolete is displayed as that resolution, not as `done`. | run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a retired task is named by its resolution' — verified: exit 0 at 7bd48fc |
| A batch of retired work does not read as built. `batch status` reports each member's resolution, so a batch whose members were all cancelled is distinguishable from one whose members were completed. | run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a batch of retired work does not read as a batch that was built' — verified: exit 0 at 7bd48fc |

### Verification performed

A failing result prints what failed. Running a command whose result did not succeed names the failure in the human output and exits non-zero; no line reports that the command completed. `kotta validate` on a workspace with invalid nodes names each violated rule and the file holding it.: run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a failed validation is not printed as completed'
The two renderings never disagree about outcome. For every command, the human output and `--json` report the same success or failure, proven by a test that drives both and compares.: run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'the human rendering and --json never disagree about the outcome'
A retired task is named by its resolution. Wherever a task is listed or shown — `task list`, `task show`, and the board — a task that ended at `done` with resolution cancelled, duplicate or obsolete is displayed as that resolution, not as `done`.: run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a retired task is named by its resolution'
A batch of retired work does not read as built. `batch status` reports each member's resolution, so a batch whose members were all cancelled is distinguishable from one whose members were completed.: run: npx vitest run tests/integration/rendering-fidelity.test.ts -t 'a batch of retired work does not read as a batch that was built'

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
