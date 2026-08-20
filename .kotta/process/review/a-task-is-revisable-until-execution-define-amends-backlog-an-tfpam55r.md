---
id: T-01m0fq323xrdk0ytawtfpam55r
title: 'A task is revisable until execution: define amends backlog and defined'
status: review
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on: []
blocks: []
spec:
  - BR-01m0fp2hdk2czsca5jrk73wh2a
  - EX-01m0fp2hdkczd788pgpstv0cq7
branch: >-
  feat/T-01m0fq323xrdk0ytawtfpam55r-a-task-is-revisable-until-execution-define-amends-backlog-an
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
assigned_agent: codex
worktree: .worktrees/T-01m0fq323xrdk0ytawtfpam55r
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 16b1ffd85a45e0ed12fa7bff764ebc91b8bd46ec
---
## Outcome

Until a claim exists, a task is a living document: `contract define` amends a task in backlog or defined - title included - and validation re-runs on every amendment. The cancel-then-reopen detour for a typo or a narrowed scope (F-01kzhjhe5t9exnxr4fxvjsfgbq, F-147t946f, F-a469asbk) ends; history records an amendment, not a retirement that never happened.

## Scope

The define command's state precondition (backlog and defined instead of backlog only), title amendment from the definition source, updated_at semantics, and the MCP define tool. The file's slug follows the title; the id never changes.

## Non-goals

No amendment from active onward - the brief is the executing agent's input and the repair path owns that case. No changes to cancel or reopen.

## Acceptance

- define on a defined task amends body, definition fields and title, and the task remains defined after passing validation.
- define on an active, review or done task is refused naming the rule.
- An amended title renames the file slug while the id and event history are untouched.

## Verification

- Integration tests per state, including the title-rename round-trip and refusal cases.

## Constraints

Identifiers are permanent; the amendment appends to history rather than rewriting it.

## Open decisions

None.

## Execution notes

Spec side: "A task is revisable until execution", "A typo is fixed in place".

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| define on a defined task amends body, definition fields and title, and the task remains defined after passing validation. | Acceptance 1: tests/integration/contract-flow.test.ts proves a defined task accepts amended body, metadata and title while remaining defined. Acceptance 2: the same suite refuses active, review and done states with the pre-execution rule. Acceptance 3: the title round-trip proves the slug changes, the T-id stays fixed and prior event ids remain unchanged while an amendment event is appended. MCP coverage: tests/integration/mcp.test.ts exercises the same defined amendment through contract_define. Verification: npm test passed 350 tests with 1 skipped on the feature branch; the coordinator-combined focused suite passed 25 tests; npm run typecheck, npm run build and kotta validate passed. |
| define on an active, review or done task is refused naming the rule. | Acceptance 1: tests/integration/contract-flow.test.ts proves a defined task accepts amended body, metadata and title while remaining defined. Acceptance 2: the same suite refuses active, review and done states with the pre-execution rule. Acceptance 3: the title round-trip proves the slug changes, the T-id stays fixed and prior event ids remain unchanged while an amendment event is appended. MCP coverage: tests/integration/mcp.test.ts exercises the same defined amendment through contract_define. Verification: npm test passed 350 tests with 1 skipped on the feature branch; the coordinator-combined focused suite passed 25 tests; npm run typecheck, npm run build and kotta validate passed. |
| An amended title renames the file slug while the id and event history are untouched. | Acceptance 1: tests/integration/contract-flow.test.ts proves a defined task accepts amended body, metadata and title while remaining defined. Acceptance 2: the same suite refuses active, review and done states with the pre-execution rule. Acceptance 3: the title round-trip proves the slug changes, the T-id stays fixed and prior event ids remain unchanged while an amendment event is appended. MCP coverage: tests/integration/mcp.test.ts exercises the same defined amendment through contract_define. Verification: npm test passed 350 tests with 1 skipped on the feature branch; the coordinator-combined focused suite passed 25 tests; npm run typecheck, npm run build and kotta validate passed. |

### Verification performed

Acceptance 1: tests/integration/contract-flow.test.ts proves a defined task accepts amended body, metadata and title while remaining defined. Acceptance 2: the same suite refuses active, review and done states with the pre-execution rule. Acceptance 3: the title round-trip proves the slug changes, the T-id stays fixed and prior event ids remain unchanged while an amendment event is appended. MCP coverage: tests/integration/mcp.test.ts exercises the same defined amendment through contract_define. Verification: npm test passed 350 tests with 1 skipped on the feature branch; the coordinator-combined focused suite passed 25 tests; npm run typecheck, npm run build and kotta validate passed.

### Deviations

None.

### Observations created

None.

### Known concerns

None.
