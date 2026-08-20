---
id: T-01m0fq2zthr89c1qyx6hdkdv3k
title: >-
  The product speaks task: contract → task on every surface, with read
  compatibility
status: review
origin: human
types:
  - workflow
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on:
  - T-01m0fq306xed253zf243bwk94f
  - T-01m0fq30n1ntmbvamm6vs5h0w6
  - T-01m0fq30yzdteeqa14bkgg3d1k
  - T-01m0fq318dpmktbc2jtv3d65m7
  - T-01m0fq31gx2wpe2jzaebskv4c0
  - T-01m0fq31tbjb4xpdybxhxpb5jf
  - T-01m0fq323xrdk0ytawtfpam55r
blocks: []
spec:
  - GT-01m0f0wn89w5k8sk1rgegc9rxm
  - E-01m0f0wn898ayyrvy613zjx3ye
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
branch: >-
  feat/T-01m0fq2zthr89c1qyx6hdkdv3k-the-product-speaks-task-contract-task-on-every-surface-with-
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
coverage:
  Every surface names the work unit task; contract appears only in compatibility shims and history.:
    - GT-01m0f0wn89w5k8sk1rgegc9rxm
    - E-01m0f0wn898ayyrvy613zjx3ye
  'A workspace written by the previous version is read correctly, with a deprecation warning naming the migration.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  kotta sync regenerates AGENTS.md and skills in the new vocabulary; the migration note reaches the CHANGELOG and the site.:
    - GT-01m0f0wn89w5k8sk1rgegc9rxm
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
assigned_agent: codex
worktree: .worktrees/T-01m0fq2zthr89c1qyx6hdkdv3k
execution_mode: fresh
branch_origin: created
start_ref: coord/P-01m0fq77101axprvcjwrq3bs61
start_commit: 9027fe170d9f2a54cfacf416c527b45c3925f294
dependency_integration_target: coord/P-01m0fq77101axprvcjwrq3bs61
---
## Outcome

The product speaks the accepted vocabulary: the work unit is a task on every surface - CLI commands, MCP tools, board, skills, schemas, templates, docs and site. D-01m0fp20dxr4vp5q8gw48n6dqf lands in the running system, closing the spec-code vocabulary gap this batch's other tasks were built inside.

## Scope

Command and tool names (task new/define/…), stored status vocabulary and directory names where they say contract, schemas and their published copies, the AGENTS.md template and kotta sync output, the shipped skills' wording, board labels already partly ahead, README and site. Read compatibility for one version at least: old names and stored forms are read with a warning, per the D-010 pattern; the a-team alias precedent applies.

## Non-goals

No identifier changes of any kind - ids are permanent, T- prefixes stay. No behavior changes: this task renames what the other seven built. Neighbour workspace migration runs as its own follow-up, not here.

## Acceptance

- Every surface names the work unit task; contract appears only in compatibility shims and history.
- A workspace written by the previous version is read correctly, with a deprecation warning naming the migration.
- kotta sync regenerates AGENTS.md and skills in the new vocabulary; the migration note reaches the CHANGELOG and the site.

## Verification

- The full test suite in the new vocabulary, plus a compatibility fixture from a pre-rename workspace.
- A grep gate over src, skills, templates and site for the old term outside compatibility code.

## Constraints

Scheduled last in the batch: it sweeps the other tasks' work once. Neighbour repos' AGENTS.md update in one round with this, so the approval rule does not live in divergent copies.

## Open decisions

None.

## Execution notes

Third rename on these files; D-006/D-007 staging precedent applies.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Every surface names the work unit task; contract appears only in compatibility shims and history. | Public source, CLI, MCP, board, schemas, templates, skills, docs and site use task; the repository grep gate found the legacy term only in src/compatibility/task-v3.ts, src/commands/migrate.ts and historical material. The full Vitest suite passed: 55 files, 386 tests passed, 1 skipped. |
| A workspace written by the previous version is read correctly, with a deprecation warning naming the migration. | tests/integration/task-vocabulary-compat.test.ts proves a schema-v3 workspace is readable through task list and the legacy command alias, both warnings name kotta migrate --dry-run and kotta migrate; board normalization and ID-stable v4 migration also pass. |
| kotta sync regenerates AGENTS.md and skills in the new vocabulary; the migration note reaches the CHANGELOG and the site. | tests/integration/sync.test.ts verifies new task skills and safe removal of Kotta-owned legacy skill directories; templates/AGENTS.md, CHANGELOG.md and site/index.html carry the new vocabulary and migration path; all 5 Playwright site tests passed and npm run verify:pack passed. |

### Verification performed

Every surface names the work unit task; contract appears only in compatibility shims and history.: Public source, CLI, MCP, board, schemas, templates, skills, docs and site use task; the repository grep gate found the legacy term only in src/compatibility/task-v3.ts, src/commands/migrate.ts and historical material. The full Vitest suite passed: 55 files, 386 tests passed, 1 skipped.
A workspace written by the previous version is read correctly, with a deprecation warning naming the migration.: tests/integration/task-vocabulary-compat.test.ts proves a schema-v3 workspace is readable through task list and the legacy command alias, both warnings name kotta migrate --dry-run and kotta migrate; board normalization and ID-stable v4 migration also pass.
kotta sync regenerates AGENTS.md and skills in the new vocabulary; the migration note reaches the CHANGELOG and the site.: tests/integration/sync.test.ts verifies new task skills and safe removal of Kotta-owned legacy skill directories; templates/AGENTS.md, CHANGELOG.md and site/index.html carry the new vocabulary and migration path; all 5 Playwright site tests passed and npm run verify:pack passed.

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
