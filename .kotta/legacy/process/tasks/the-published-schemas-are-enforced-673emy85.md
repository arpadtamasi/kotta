---
id: T-01m0jdnwfg647qh8j2673emy85
title: The published schemas are enforced
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
  - BR-01m0sj2f8mxydc7zxz6y8xn6b1
  - EX-01m0sj2f8m02k71b0d5ph3d9qf
  - IF-01m0f0wn897newtcbva7xqgvx6
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-24'
coverage:
  'Every published schema is asserted against the code. For each file under `schemas/`, the suite reads the shipped file and compares the values it permits, and the fields it requires, against the constants the code enforces.':
    - BR-01m0sj2f8mxydc7zxz6y8xn6b1
    - IF-01m0f0wn897newtcbva7xqgvx6
  'A drift in either direction fails and names the field. Adding a permitted value to a schema without adding it to the code fails the suite naming the schema and the field, and so does the reverse.':
    - BR-01m0sj2f8mxydc7zxz6y8xn6b1
    - EX-01m0sj2f8m02k71b0d5ph3d9qf
  'The check reads the published file. The assertion loads `schemas/*.json` from disk rather than any copy kept beside the test, so a passing suite is evidence about what Kotta publishes.':
    - BR-01m0sj2f8mxydc7zxz6y8xn6b1
    - EX-01m0sj2f8m02k71b0d5ph3d9qf
  'A schema nobody holds to is not left published. Any schema, or field of one, that no code enforces is either given an enforcing constant or removed, and the outcome is stated per schema rather than left to the reader to infer.':
    - BR-01m0sj2f8mxydc7zxz6y8xn6b1
    - IF-01m0f0wn897newtcbva7xqgvx6
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 84e3985271cf90b1460ac631356ecb5dc057c2d9
resolution: completed
approved_by: cli
approved_at: '2026-08-24T10:34:05.611Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

The six schemas Kotta publishes state what its code actually holds to. Today they declare forty-four required fields and six sets of permitted values between them, the code duplicates all of it in hand-maintained arrays, and exactly one pairing is checked — the observation enums (`src/commands/observation.ts:16` names the agreement test). The other five are documentation wearing the costume of a contract: anyone building an integration against `task.schema.json` is building on a promise nothing keeps, and a value added on one side would never be noticed missing on the other.

## Scope

- One suite that, for every file in `schemas/`, reads the shipped JSON and asserts agreement with the constant the code enforces: permitted values and required fields, in both directions.
- The pairing is stated explicitly per schema, so a schema with no enforcing constant is a visible decision rather than a silent omission.
- Whatever the comparison turns up: a value present on one side only is reconciled, and the reconciliation is part of this task rather than deferred.

## Non-goals

- Making validation read JSON Schema at runtime. The code keeps its typed constants; this asserts that the two agree, and adds no schema-validation dependency to the runtime path.
- The specification forms under `.kotta/spec/forms/`. That registry is project-owned and the workspace already validates against it.
- Widening what the schemas describe, or adding fields to either side. A disagreement is reconciled toward what the code already enforces unless the schema is plainly right.

## Constraints

The assertion must fail for a missing pairing, not skip it. A check that quietly covers five of six schemas would be the same defect one level up — and this task exists because exactly that happened.

Reconciling a disagreement changes behaviour only if the code is wrong. Where the schema is the one that drifted, the schema moves.

## Open decisions

None.

## Execution notes

`schemas/` holds task, observation, batch, claim, event and config. The constants live in `src/core/validation.ts` (`TASK_STATE_VALUES`, `COMMON_SECTIONS`), `src/commands/observation.ts` (`OBSERVATION_DISPOSITIONS`), `src/commands/task.ts` (`CANCEL_RESOLUTIONS`), `src/core/events.ts`, and `src/core/config.ts`.

The existing observation agreement test is the pattern to generalise, not to copy alongside: one table of pairings driving one loop keeps a new schema from being added without one.

`config.schema.json` pins the workspace shape version as a const, which the v5 work already had to update by hand — that pairing belongs in the table too.

## Acceptance

- Every published schema is asserted against the code. For each file under `schemas/`, the suite reads the shipped file and compares the values it permits, and the fields it requires, against the constants the code enforces.
- A drift in either direction fails and names the field. Adding a permitted value to a schema without adding it to the code fails the suite naming the schema and the field, and so does the reverse.
- The check reads the published file. The assertion loads `schemas/*.json` from disk rather than any copy kept beside the test, so a passing suite is evidence about what Kotta publishes.
- A schema nobody holds to is not left published. Any schema, or field of one, that no code enforces is either given an enforcing constant or removed, and the outcome is stated per schema rather than left to the reader to infer.

## Verification

- `run: npx vitest run tests/integration/published-schemas.test.ts` — the new suite.
- `run: npm test` — the full suite, since reconciliation may move a constant.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Every published schema is asserted against the code. For each file under `schemas/`, the suite reads the shipped file and compares the values it permits, and the fields it requires, against the constants the code enforces. | run: npx vitest run tests/integration/published-schemas.test.ts — verified: exit 0 at fea93b9 |
| A drift in either direction fails and names the field. Adding a permitted value to a schema without adding it to the code fails the suite naming the schema and the field, and so does the reverse. | Probed both directions by hand at 69746e2. Adding 'paused' to task.schema.json status made the suite fail naming 'task.schema.json · status' with + "paused" in the diff; adding 'borrowed' to CLAIM_ORIGINS made 'claim.schema.json · origin' fail the same way. Both probes reverted; git diff on schemas/ and src/ is clean. |
| The check reads the published file. The assertion loads `schemas/*.json` from disk rather than any copy kept beside the test, so a passing suite is evidence about what Kotta publishes. | run: npx vitest run tests/integration/published-schemas.test.ts -t 'every published enum has a pairing' — verified: exit 0 at fea93b9 |
| A schema nobody holds to is not left published. Any schema, or field of one, that no code enforces is either given an enforcing constant or removed, and the outcome is stated per schema rather than left to the reader to infer. | All eighteen published sets now have a runtime constant; ten were added in this task (ENTITY_ORIGINS, OBSERVATION_ORIGINS, EXECUTION_MODES, CLAIM_ORIGINS, OBSERVATION_TYPES, CONFIDENCE_LEVELS, SEVERITY_LEVELS, PRIORITY_LEVELS, RISK_LEVELS in src/filesystem/entities.ts; EVENT_KINDS, EVENT_ROLES, APPROVAL_PHASE_VALUES in src/core/events.ts; TASK_RESOLUTIONS in src/commands/task.ts), and none was removed because each turned out to be enforced in fact. The totality test fails on any unpaired enum, which is how task.priority and task.risk were found. |

### Verification performed

Every published schema is asserted against the code. For each file under `schemas/`, the suite reads the shipped file and compares the values it permits, and the fields it requires, against the constants the code enforces.: run: npx vitest run tests/integration/published-schemas.test.ts
A drift in either direction fails and names the field. Adding a permitted value to a schema without adding it to the code fails the suite naming the schema and the field, and so does the reverse.: Probed both directions by hand at 69746e2. Adding 'paused' to task.schema.json status made the suite fail naming 'task.schema.json · status' with + "paused" in the diff; adding 'borrowed' to CLAIM_ORIGINS made 'claim.schema.json · origin' fail the same way. Both probes reverted; git diff on schemas/ and src/ is clean.
The check reads the published file. The assertion loads `schemas/*.json` from disk rather than any copy kept beside the test, so a passing suite is evidence about what Kotta publishes.: run: npx vitest run tests/integration/published-schemas.test.ts -t 'every published enum has a pairing'
A schema nobody holds to is not left published. Any schema, or field of one, that no code enforces is either given an enforcing constant or removed, and the outcome is stated per schema rather than left to the reader to infer.: All eighteen published sets now have a runtime constant; ten were added in this task (ENTITY_ORIGINS, OBSERVATION_ORIGINS, EXECUTION_MODES, CLAIM_ORIGINS, OBSERVATION_TYPES, CONFIDENCE_LEVELS, SEVERITY_LEVELS, PRIORITY_LEVELS, RISK_LEVELS in src/filesystem/entities.ts; EVENT_KINDS, EVENT_ROLES, APPROVAL_PHASE_VALUES in src/core/events.ts; TASK_RESOLUTIONS in src/commands/task.ts), and none was removed because each turned out to be enforced in fact. The totality test fails on any unpaired enum, which is how task.priority and task.risk were found.

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
