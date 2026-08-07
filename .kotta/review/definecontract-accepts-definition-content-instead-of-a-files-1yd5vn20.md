---
id: T-01kzda6d8qr4yxqcb41yd5vn20
title: defineContract accepts definition content instead of a filesystem path
status: review
origin: human
types:
  - refactor
profiles:
  - refactor
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
branch: >-
  refactor/T-01kzda6d8qr4yxqcb41yd5vn20-definecontract-accepts-definition-content-instead-of-a-files
pull_request: 'https://github.com/arpadtamasi/kotta/pull/30'
created_at: '2026-08-07'
updated_at: '2026-08-07'
assigned_agent: claude
worktree: .worktrees/T-01kzda6d8qr4yxqcb41yd5vn20
execution_mode: fresh
---
# T-01kzda6d8qr4yxqcb41yd5vn20 — defineContract accepts definition content instead of a filesystem path

## Outcome

Any caller that already holds a contract definition as text can formalize a backlog contract by
passing that text. The filesystem stops being part of the call contract. The CLI keeps reading
`--from <path>` and the MCP tool stops writing a temporary file it only created to satisfy a
CLI-shaped signature.

## Current structural problem

`defineContract(id, source, repositoryRoot?)` in `src/commands/contract.ts:42` takes `source` as a
filesystem path. It immediately resolves it, checks existence and reads it:

```
const sourcePath = resolve(source);
if (!existsSync(sourcePath)) throw new Error(`Contract definition was not found: ${sourcePath}`);
const draft = parseMarkdown(readFileSync(sourcePath, "utf8"));
```

The MCP `contract_define` tool receives the definition as a string over the wire and therefore has
to invent a file to hand back to the service. `src/commands/mcp.ts:93` opens a temporary directory,
writes the string, calls `defineContract` with the path, and cleans up in a `finally`. Four
filesystem operations and a lifetime to manage, for content that was already in memory.

This is the only service in the layer shaped this way. `newContract`, `startContract`,
`reviewContract`, `newObservation` and `createDecision` all take structured options and plain
values.

## Demonstrated cost or risk

- The MCP adapter carries `mkdtempSync`, `writeFileSync`, `rmSync` and a `try/finally` that exist
  purely as an impedance match. That is the largest tool body in `src/commands/mcp.ts` and the only
  one with resource cleanup to get wrong.
- The temporary directory leaks on hard process termination, because cleanup depends on the
  `finally` running.
- Definition text transits `tmpdir()` — a world-readable location on the default macOS and Linux
  configurations — although both the caller and the destination are inside the repository.
- Every additional non-CLI surface pays the same tax. The board API and any future batch or test
  helper that composes a definition in memory must repeat the temp-file dance or duplicate the
  parse.
- The error message on a missing file names a path the MCP caller never supplied and cannot act on.

## Behavioural invariants

- `kotta contract define <id> --from <file>` keeps its name, flag, human output, `--json` output
  and exit code.
- A missing, unreadable or empty `--from` file still fails, with the path still named in the CLI
  error.
- Definition frontmatter handling is unchanged: `DEFINITION_FIELDS` remains the accepted set, an
  unsupported field still throws, and a mismatched `id` still throws.
- The `depends_on`/`blocks` self-reference and existence checks still run before any write.
- The written contract file is byte-identical to what the current implementation produces for the
  same definition text.
- The write stays atomic: candidate file, validate, rename, unlink on failure.
- Defining a contract that is not in `backlog` still throws.
- MCP `contract_define` keeps its tool name, input schema, annotations and structured result shape.

## Target structural property

`defineContract` takes the definition **text**. The CLI reads `--from` and passes the file's
contents. The MCP tool passes the string it already received. No temporary file exists in either
path, and the service has no filesystem dependency for its input.

## Excluded redesign

- No change to contract validation rules, required sections, profile requirements or the contract
  schema.
- No change to the `backlog → defined` lifecycle or to who may perform it.
- No rename of the CLI `--from` flag and no new CLI flag for inline content.
- No signature change to any other service function, even where a similar improvement exists.
- No change to `parseMarkdown`, `renderMarkdown` or the atomic-write helper.
- No change to `contract_define`'s wire schema.

## Behaviour-preserving verification

The invariants above are checked by running the existing define coverage unchanged against the new
signature, so the tests act as the control rather than being rewritten to fit the change:

- The existing `contract define` integration tests are amended only where they construct a path,
  never where they assert an outcome. Any assertion that has to change marks a behaviour change and
  fails this contract.
- A golden comparison defines the same contract before and after the change from identical
  definition text and asserts the resulting contract file is byte-identical.
- The CLI's missing-file and unreadable-file errors are asserted explicitly, because that is the
  one behaviour that moves between layers and is therefore the likeliest to drift.
- `npm run typecheck` is treated as coverage: the parameter change is type-visible, so a caller
  left passing a path cannot compile.

## Scope

1. Change `defineContract`'s second parameter from a path to the definition text, and remove the
   `resolve`/`existsSync`/`readFileSync` block from the service.
2. Move file reading to the CLI action for `contract define`, preserving the current
   "definition was not found" error and its path.
3. Replace the MCP `contract_define` temp-file block with a direct call, removing `mkdtempSync`,
   `writeFileSync`, `rmSync` and the `try/finally` cleanup from that tool.
4. Update any other in-repository caller and the tests that pass a path.
5. Keep the empty-body guard in the service, since it validates content rather than a file.

## Non-goals

- Applying the same change to other services that still take paths, if any are found outside this
  call.
- Adding an inline-definition CLI flag.
- Making the definition source pluggable (stdin, URL, editor).
- Touching the `contract sign` path or approval handling.

## Acceptance

- `defineContract` has no `existsSync`, `resolve` or `readFileSync` call for its definition input,
  and its parameter is the definition text.
- `kotta contract define <id> --from <file>` produces the same contract file, human output and
  `--json` output as before the change, for a definition exercising frontmatter overrides of
  `types`, `profiles`, `priority`, `risk`, `depends_on` and `blocks`.
- `kotta contract define <id> --from missing.md` still fails naming the resolved path, and leaves
  the contract in `backlog`.
- A definition with an unsupported frontmatter field, a mismatched `id`, or an empty body still
  fails, and no partial write remains.
- `src/commands/mcp.ts` contains no temporary-file creation for `contract_define`, and the tool
  still returns its current structured result for a valid definition.
- MCP `contract_define` against a contract that is not in `backlog` still returns a tool error
  rather than throwing out of the server.
- A failed definition leaves no `.define-<pid>.tmp` file beside the contract.
- `kotta validate` passes on the workspace after a successful define.

## Verification

- `npx vitest run tests/integration/contract-flow.test.ts` — define happy path, frontmatter
  overrides, wrong-state rejection and unsupported-field rejection.
- The MCP test covering `contract_define` — valid definition, non-backlog contract, empty body.
- A test asserting the CLI still reports the resolved path for a missing `--from` file.
- `npm run typecheck` — the signature change surfaces every remaining caller.
- `npx vitest run --exclude '.worktrees/**'` — full suite, excluding linked worktrees so the run
  measures this branch only.

## Constraints

- `.kotta/` remains the canonical source of truth, and every mutation keeps going through the
  validated services.
- The atomic candidate-validate-rename write must not be weakened; only the input source changes.
- No behaviour change is acceptable as a side effect. This contract is behaviour-preserving by
  construction, and any observable difference is a defect rather than an improvement.
- Existing unrelated contracts and observations are out of scope.

## Open decisions

None.

## Execution notes

- The CLI action for `contract define` is registered in `src/cli/index.ts`; it currently forwards
  `options.from` straight through.
- The MCP block to remove is `src/commands/mcp.ts:93` through the `finally` that unlinks the
  temporary directory.
- Keep the "Contract definition body is required." guard in the service — it validates content and
  belongs there. Only the file lookup moves out.
- This contract exists because the file-path coupling was found while explaining why the MCP and
  CLI surfaces duplicate work. It is deliberately narrow so that the wider surface question can be
  decided separately.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `defineContract` has no `existsSync`, `resolve` or `readFileSync` call for its definition input, | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| `kotta contract define <id> --from <file>` produces the same contract file, human output and | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| `kotta contract define <id> --from missing.md` still fails naming the resolved path, and leaves | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| A definition with an unsupported frontmatter field, a mismatched `id`, or an empty body still | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| `src/commands/mcp.ts` contains no temporary-file creation for `contract_define`, and the tool | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| MCP `contract_define` against a contract that is not in `backlog` still returns a tool error | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| A failed definition leaves no `.define-<pid>.tmp` file beside the contract. | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| `kotta validate` passes on the workspace after a successful define. | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| refactor: behavioral_invariants_verified | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| refactor: target_structure_achieved | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |
| refactor: excluded_redesign_not_introduced | Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a. |

### Verification performed

Acceptance 1: src/commands/contract.ts defineContract(id, definition) has no resolve/existsSync/readFileSync on its definition input; the parameter is the text. Acceptance 2-3: src/cli/index.ts reads --from, passes the contents, and preserves the 'Contract definition was not found: <resolved path>' error verbatim; a new integration test in tests/integration/contract-flow.test.ts asserts that path and that the contract stays in backlog. Acceptance 4: the unsupported-field, mismatched-id and empty-body guards are untouched in the service and their existing tests pass unmodified. Acceptance 5-6: src/commands/mcp.ts no longer imports mkdtempSync/writeFileSync/rmSync/tmpdir, calls defineContract with the wire string inside withControlPlaneMutation, and keeps its tool name, schema, annotations and result shape. Acceptance 7: the atomic candidate-validate-rename write is unchanged, so a failed definition still leaves no .define-<pid>.tmp file. Acceptance 8: kotta validate passes. Behaviour-preserving control: no existing test assertion required a change. Verification: npx vitest run 39 files / 237 passed / 1 skipped; npm run typecheck passes; npm run build passes; tests/integration/contract-flow.test.ts 6/6. Commit c93049a.

### Deviations

None.

### Observations created

Six, all recorded during this contract's execution: F-01kzd9sh03y7hwwbeen5cp4s0q (kotta integrate supports only codex), F-01kzdax5af5edadf83rq792eky (the implemented state never checks for change), F-01kzdaxefyc4jxk1hwe3z74k41 (the agent stdout is discarded), F-01kzdaxs0133htw4ws8m4rw9a3 (resume does not update the claim), F-01kzdebgbn97ve9bby1me3jkh4 (the claude invocation lacks a permission flag), F-01kzdhg6mx6ght9h4m504w65gs (a dirty control worktree discards a completed run's record). The middle five were dispositioned attach-existing onto T-01kzdhtqw01nbgdg5dd9cw3zpr. A seventh, on contract.reopen having no chat path, was recorded after that contract was signed.

### Known concerns

The execution that produced this work is missing from the lifecycle log, and the earlier submission of this review described the cause wrongly. Correcting it here: the resume did NOT abort before starting. It launched claude, the agent ran to completion and produced all four file changes, and only then did runAgent try to append its execution event through withControlPlaneMutation without requireClean: false (src/commands/execute.ts:258). assertClean (src/git/control-plane.ts:94) found the control worktree dirty from a single untracked observation file Kotta itself had just created, threw, and the run exited 1 with no event and no state commit. The only surviving execution event is therefore the earlier no-op run, recorded as implemented. This is F-01kzdhg6mx6ght9h4m504w65gs and is covered by T-01kzdhtqw01nbgdg5dd9cw3zpr. The code in this contract was verified directly against the worktree and the test suite, not through the lifecycle log.
