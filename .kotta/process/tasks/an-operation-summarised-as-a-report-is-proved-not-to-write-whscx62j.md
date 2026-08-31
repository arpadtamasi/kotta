---
id: T-01m1bb1fhe0fsmk05swhscx62j
title: An operation summarised as a report is proved not to write
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
  - BR-01m0nsyasfnjc9s4073r8zb33j
branch: >-
  feat/T-01m1bb1fhe0fsmk05swhscx62j-an-operation-summarised-as-a-report-is-proved-not-to-write
pull_request: null
created_at: '2026-08-31'
updated_at: '2026-08-31'
coverage:
  'Every operation declares whether it reads or writes, and an entry that omits it fails the build the way a missing surface name does.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
  'A read-declared operation is proved to read: run against a populated workspace, it leaves every file and the commit byte-identical.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
  'An operation that writes and is summarised as a report, a check or a validation fails by name, and the two that do so today are corrected.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
assigned_agent: claude
worktree: .worktrees/T-01m1bb1fhe0fsmk05swhscx62j
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: a82236b160f331b6ecb3bf0a26cba26645efc02a
review_commit: e73c898190d5e19b232d152062415b112e76d883
---
# T-01m1bb1fhe0fsmk05swhscx62j — An operation summarised as a report is proved not to write

## Outcome

The accepted rule says a declaration naming an operation for what it reports must say so when the
operation also writes, and that an entry summarised as a check, a report or a validation which
changes stored state is wrong rather than incomplete. Nothing checks it, and two entries are wrong
today:

- `workspace.validate` — "Validate every record in the workspace." `validateWorkspace` promotes a
  backlog batch to defined through `validateBatch`, writes the record, appends a lifecycle event
  and commits (`src/commands/batch.ts:238-244`).
- `batch.validate` — "Validate a batch and plan its dependency waves." The same promotion, from the
  same code path.

A caller reading either summary expects a read and gets a commit. That is not hypothetical here:
`batch new` began committing on 2026-08-28, a fixture that had never needed a git identity started
failing, and the 0.11.0 release died on it. The caller was not warned by anything, because nothing
in the declaration was obliged to warn.

## Scope

- A declared effect on every operation: it reads, or it writes.
- Proving `reads` by execution rather than by assertion — running the operation and comparing the
  workspace before and after.
- Failing an entry that writes while its summary reads as a report, a check or a validation.
- Correcting the two entries that do exactly that today.

## Non-goals

- Changing what any operation does. `batch validate` promoting a validated batch is the accepted
  state machine; what is wrong is the sentence that hides it, not the transition.
- Deriving the effect from the implementation by static analysis. A declaration is a promise
  someone makes, and a promise inferred from the code it is meant to constrain constrains nothing.
- Operations whose surface is neither CLI nor a runnable tool, and `workspace.serve-mcp`,
  `workspace.board` and `task.execute`, which are long-running or spawn processes: the execution
  proof covers what a fixture can run to completion.
- Writes outside the workspace. `task brief --out` writes where the caller pointed it; stored state
  is the workspace and the commit, and that is what is compared.

## Acceptance

- Every operation declares whether it reads or writes, and an entry that omits it fails the build the way a missing surface name does.
- A read-declared operation is proved to read: run against a populated workspace, it leaves every file and the commit byte-identical.
- An operation that writes and is summarised as a report, a check or a validation fails by name, and the two that do so today are corrected.

## Verification

- run: npx vitest run tests/integration/operation-effect.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The effect is declared, not inferred, and it is required — an entry cannot be silent about it.
- The proof runs the built binary against a fixture, never a stub: what is being tested is the
  operation, not a description of it.
- The comparison is of the whole workspace and of HEAD, so a write that avoids `git status` by
  committing is still caught.

## Open decisions

None.

## Execution notes

`src/core/operations.ts` is the registry; `tests/integration/operation-registry.test.ts` holds the
totality tests and is where the required-field check belongs beside them. The execution proof needs
its own file because it builds a populated fixture — a task, an observation, a batch, a decision —
and walks the read-declared commands against it. Argumentless commands run as they are; the ones
taking an id take the fixture's.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Every operation declares whether it reads or writes, and an entry that omits it fails the build the way a missing surface name does. | run: npx vitest run tests/integration/operation-registry.test.ts -t "declares whether it reads or writes" — verified: exit 0 at e73c898 |
| A read-declared operation is proved to read: run against a populated workspace, it leaves every file and the commit byte-identical. | run: npx vitest run tests/integration/operation-effect.test.ts -t "leaves the workspace and the commit\|arguments here, so none can be skipped\|not vacuous\|does commit" — verified: exit 0 at e73c898 |
| An operation that writes and is summarised as a report, a check or a validation fails by name, and the two that do so today are corrected. | run: npx vitest run tests/integration/operation-registry.test.ts -t "not summarised as a report" — verified: exit 0 at e73c898 |

### Verification performed

Every operation declares whether it reads or writes, and an entry that omits it fails the build the way a missing surface name does.: run: npx vitest run tests/integration/operation-registry.test.ts -t "declares whether it reads or writes"
A read-declared operation is proved to read: run against a populated workspace, it leaves every file and the commit byte-identical.: run: npx vitest run tests/integration/operation-effect.test.ts -t "leaves the workspace and the commit|arguments here, so none can be skipped|not vacuous|does commit"
An operation that writes and is summarised as a report, a check or a validation fails by name, and the two that do so today are corrected.: run: npx vitest run tests/integration/operation-registry.test.ts -t "not summarised as a report"

### Deviations

None.

### Observations created

F-hb96agns — a human-approved decision is the one record no command commits. F-dzx96s2m — a command's help text and its declaration are two descriptions of one operation, and nothing keeps them in agreement.

### Known concerns

The reporting-verb rule reads the summary, so it is a heuristic on prose: it catches an opening verb with no writing stem anywhere in the sentence, which is the shape both failures had. The execution proof is the load-bearing half. Declaring the effect by hand found two mislabels of my own within minutes, which is the argument for the run-it check rather than against the field. The suite's fixtures are never cleaned up and filled the disk mid-run today; that is separate and not recorded here, because it is the environment rather than the workspace.
