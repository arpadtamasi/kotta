---
id: T-011
title: Add a canonical CLI writer for durable decisions
status: done
origin: human
types:
  - bug
profiles:
  - bug
  - workflow
priority: high
risk: medium
batch: P-003
depends_on: []
blocks: []
branch: fix/T-011-add-a-canonical-cli-writer-for-durable-decisions
pull_request: null
created_at: '2026-07-23'
updated_at: '2026-07-23'
assigned_agent: codex
resolution: completed
---
# T-011 — Add a canonical CLI writer for durable decisions

## Outcome

Users and agents can create validated durable decision records under `.a-team/decisions/` through the A-Team CLI, so the documented decision artifact is usable without violating the rule that canonical workspace state must not be hand-edited.

## Actual behaviour

`a-team init` creates `.a-team/decisions/`, the workspace template says that directory contains durable human decisions, and the exploration skill reads it. The CLI exposes `init`, `validate`, `status`, `ticket`, `finding`, `package`, `claim`, and `ui`, but no decision writer. The canonical workflow instructions require mutations to pass through the CLI, leaving no supported way to populate the directory.

## Expected behaviour

The CLI exposes a validated decision-creation command that writes a durable human decision into `.a-team/decisions/`, rejects malformed or duplicate input without partial state, and makes the result available to workspace exploration and validation.

## Reproduction steps

1. Run `a-team init` in a Git repository.
2. Confirm that `.a-team/decisions/` exists and is empty.
3. Run `a-team --help` and inspect every command namespace.
4. Try to record a durable cutover decision without directly editing `.a-team/`.
5. Observe that no supported CLI mutation exists.

## Environment

Current `a-team` repository and published CLI contract observed on 2026-07-23. The defect is present in `src/cli/index.ts`, `src/filesystem/workspace.ts`, `templates/workspace/README.md`, and the bundled workspace skills.

## Frequency

Deterministic whenever a user or agent needs to persist a durable decision.

## Impact

The documented canonical model is internally inconsistent. Users must either violate the no-hand-edit invariant, omit a decision that downstream exploration expects, or use commit and migration metadata as an undocumented substitute. This weakens auditability and makes the empty decisions directory misleading.

## Regression-test expectation

Add CLI and integration coverage that initializes a workspace, creates a decision through the supported command, validates the workspace, reads the resulting record, and verifies duplicate, invalid, and interrupted writes leave canonical state unchanged.

## Actors

- Human decision owner supplying the durable decision.
- Agent or operator invoking the CLI on the human's instruction.
- CLI validator and canonical filesystem writer.
- Workspace explorer reading recorded decisions.

## Initial state

An initialized, valid A-Team workspace has a `.a-team/decisions/` directory and may contain zero or more valid decision records.

## States

- `absent`: the proposed decision has not been recorded.
- `validating`: input and target identity are checked before publication.
- `recorded`: one valid canonical decision record exists.
- `rejected`: invalid or duplicate input produced no canonical mutation.

## Transitions

- An explicit decision-create command moves `absent → validating → recorded`.
- Validation, duplicate identity, or write failure moves `validating → rejected` with no partial canonical file.
- Reading, status, and validation do not change decision state.

## Triggers

An explicit CLI invocation by a human or by an agent acting on a clear human decision.

## Permissions

Only an explicit mutation command may create canonical decision state. Read-only commands and exploratory skills may inspect records but must not create or rewrite them. The command must follow the repository's existing human-approval policy for durable human intent.

## Error paths

Missing required content, invalid identifiers or filenames, duplicate decision identity, malformed Markdown/frontmatter, unavailable workspace, and filesystem failure return actionable human and JSON errors. None may leave a partial record or corrupt generated state.

## Cancellation path

Cancellation or process failure before atomic publication leaves the decision absent and the workspace valid. A successfully published decision is not silently removed by cancellation.

## Retry and duplicate-action behaviour

Retry after a pre-publication failure is safe. Repeating a successful creation with the same identity is rejected deterministically or returns the existing record without creating a duplicate; the chosen behavior must be documented and tested.

## Audit and notification expectations

The decision record contains a stable identity, title, date, decision, context, and consequences sufficient for later inspection. Human and JSON output report the created identity and canonical path. No external notification is required.

## Scope

- Add a top-level decision command namespace and a canonical create operation.
- Define and validate the minimum durable-decision schema and filename/identity rules.
- Write the artifact atomically beneath `.a-team/decisions/`.
- Include decisions in workspace validation and expose useful human and JSON command results.
- Update CLI help, workspace documentation, and relevant skills to use the supported writer.
- Add focused unit and end-to-end CLI tests.

## Non-goals

- Building a general ADR framework or approval service.
- Automatically converting ticket open-decision sections into durable decisions.
- Editing, superseding, or deleting existing decisions unless separately specified.
- Treating commit messages or `migration.json` as the canonical decision store.
- Changing ticket, finding, or package lifecycle semantics.

## Acceptance

- `a-team --help` exposes a documented decision command with a creation path.
- In an initialized workspace, the command creates exactly one valid record beneath `.a-team/decisions/` without direct file editing.
- The created record has stable identity and the documented minimum fields for decision, context, and consequences.
- `a-team validate` succeeds after a valid creation and reports malformed decision records.
- Human and `--json` success output identify the created decision and path; failures are actionable and machine-readable.
- Invalid input, duplicate creation, and injected write failure do not leave partial files or change an existing decision.
- Workspace exploration can discover the created decision through the canonical directory.
- Documentation and skills no longer instruct or imply an impossible decision-recording workflow.

## Verification

- Add unit tests for schema validation, identity allocation, rendering, and duplicate detection.
- Add a CLI integration test covering `init → decision create → validate → inspect`.
- Add negative integration cases for missing content, malformed source, duplicate identity, and fault before atomic rename.
- Run the complete test and typecheck suites.
- In a temporary repository, record a cutover decision only through the CLI and confirm no manual `.a-team/` mutation is needed.

## Constraints

Preserve the filesystem as canonical and route the mutation through the same safety boundary as other canonical writers. Use atomic publication and stable deterministic validation. Do not hand-create a decision record as part of implementing or verifying the command.

## Open decisions

None.

## Execution notes

The concrete subcommand spelling and exact document serialization may follow existing CLI conventions, but the supported operation must be discoverable from top-level help and must not depend on undocumented manual edits.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `a-team --help` exposes a documented decision command with a creation path. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| In an initialized workspace, the command creates exactly one valid record beneath `.a-team/decisions/` without direct file editing. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| The created record has stable identity and the documented minimum fields for decision, context, and consequences. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| `a-team validate` succeeds after a valid creation and reports malformed decision records. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| Human and `--json` success output identify the created decision and path; failures are actionable and machine-readable. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| Invalid input, duplicate creation, and injected write failure do not leave partial files or change an existing decision. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| Workspace exploration can discover the created decision through the canonical directory. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| Documentation and skills no longer instruct or imply an impossible decision-recording workflow. | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| bug: expected_behavior_verified | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| bug: regression_test_added_or_exception_recorded | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| bug: affected_environment_rechecked | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| workflow: happy_path_verified | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| workflow: failure_and_cancellation_paths_verified | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |
| workflow: authorization_and_idempotency_verified | Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns. |

### Verification performed

Implementation commit 41e1a39. npm test: 12 test files passed; 25 tests passed, 1 pre-existing skipped. npm run typecheck: passed. git diff --check: passed. Focused decision coverage verifies top-level help, JSON and human success output, init -> decision create -> validate -> inspect, stable identity/date/schema rendering, missing approval/content, malformed input, invalid id, duplicate rejection without overwrite, duplicate workspace identities, injected failure cleanup and retry, malformed canonical record reporting, and existing-state preservation. Temporary repository /private/tmp/a-team-t011-verify.AeEaNl: CLI-only init and decision create produced D-001-adopt-blue-green-cutover.md; a-team validate returned ok with decisions: 1; canonical record inspection confirmed id, title, date, Decision, Context, and Consequences. Documentation and relevant skills now point to the canonical writer. No deviations, findings, or known concerns.

### Deviations

None.

### Findings created

None.

### Known concerns

None.
