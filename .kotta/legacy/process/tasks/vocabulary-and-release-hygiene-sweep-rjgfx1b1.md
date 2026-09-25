---
id: T-01m0jdnvvee6r2qsg7rjgfx1b1
title: Vocabulary and release hygiene sweep
status: done
origin: human
types:
  - docs
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0zx29x1nvccpr4xwyhjr153
  - EX-01m0zx29x1pnyjsa5dyg4dc6n5
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-26'
coverage:
  'Every published surface that tells a reader how to install Kotta names the version the package declares at that commit. Measured today: the rules file said 0.10.0, the README 0.9.0, the site 0.7.0.':
    - BR-01m0zx29x1nvccpr4xwyhjr153
  'A surface that drifts from the declared version fails a check by name, so the disagreement cannot survive a release rather than being noticed by a reader whose install failed.':
    - BR-01m0zx29x1nvccpr4xwyhjr153
    - EX-01m0zx29x1pnyjsa5dyg4dc6n5
  'No published surface names a version by hand where the package already declares one, so bumping the version is one edit and not four.':
    - BR-01m0zx29x1nvccpr4xwyhjr153
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 3e5c76b6c180829d6f4ad5a0f45f770e83ffe82c
resolution: completed
approved_by: cli
approved_at: '2026-08-26T21:08:30.391Z'
approval_basis: 'CLI --approve: task.close'
---
# T-01m0jdnvvee6r2qsg7rjgfx1b1 — Vocabulary and release hygiene sweep

## Outcome

Nothing Kotta publishes tells a reader to install a version that does not exist. The capture named
two sweeps; only one of them turned out to have an object.

**Vocabulary: measured clean, nothing to do.** Every remaining occurrence of the pre-rename
vocabulary is deliberate: `LEGACY_WORKSPACE_DIRECTORY = ".a-team"` and the `.a-team/` reader that
D-007 keeps readable, the `ticket → task` key maps `migrate` needs to read old workspaces, and the
README's own rename section. Zero drift, so the sweep half of this task is answered by the
measurement rather than by an edit.

**Release hygiene: three surfaces, three numbers, two wrong.** Measured on 2026-08-26:

| Surface | Said | Reality |
| --- | --- | --- |
| `.kotta/AGENTS.md` (generated, ships into every project) | 0.10.0 | correct — interpolated from the package |
| `README.md:124` | 0.9.0 | tagged once, never published, answers 404 |
| `site/index.html:196` | 0.7.0 | stale by three versions |

Each was true when it was written. The generated one stayed true because nobody maintains it.

## Scope

- The install version in `README.md` and in `site/index.html`.
- `site/tests/site.spec.ts`, which pins the advertised version as a literal and so drifts with it.
- A check that fails by name when a published surface disagrees with the package.

## Non-goals

- Publishing, tagging, or deciding when to release: this makes the advertised version true, it does
  not make it exist.
- The changelog, whose subject is versions past.
- The generated rules file, which already interpolates the running package and needs no repair.
- The pre-rename vocabulary, measured clean above; the task carries the measurement, not an edit.

## Acceptance

- Every published surface that tells a reader how to install Kotta names the version the package declares at that commit. Measured today: the rules file said 0.10.0, the README 0.9.0, the site 0.7.0.
- A surface that drifts from the declared version fails a check by name, so the disagreement cannot survive a release rather than being noticed by a reader whose install failed.
- No published surface names a version by hand where the package already declares one, so bumping the version is one edit and not four.

## Verification

- run: npx vitest run tests/integration/published-install-line.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The site is a static page with no build-time templating of its own; whatever keeps its version
  true must not turn it into something that needs one.
- The check reads the package as the single source, never a second copy of the number.

## Open decisions

None.

## Execution notes

The capture is from 2026-08-21, before the 0.9.0 release that was tagged and never published. That
failure is what made the README's line false, so the task's object was created after it was
written.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Every published surface that tells a reader how to install Kotta names the version the package declares at that commit. Measured today: the rules file said 0.10.0, the README 0.9.0, the site 0.7.0. | run: npx vitest run tests/integration/published-install-line.test.ts -t "in step with the package" — verified: exit 0 at a8065e0 |
| A surface that drifts from the declared version fails a check by name, so the disagreement cannot survive a release rather than being noticed by a reader whose install failed. | run: npx vitest run tests/integration/published-install-line.test.ts -t "does not declare" — verified: exit 0 at a8065e0 |
| No published surface names a version by hand where the package already declares one, so bumping the version is one edit and not four. | run: npx vitest run tests/integration/published-install-line.test.ts -t "second copy" — verified: exit 0 at a8065e0 |

### Verification performed

Every published surface that tells a reader how to install Kotta names the version the package declares at that commit. Measured today: the rules file said 0.10.0, the README 0.9.0, the site 0.7.0.: run: npx vitest run tests/integration/published-install-line.test.ts -t "in step with the package"
A surface that drifts from the declared version fails a check by name, so the disagreement cannot survive a release rather than being noticed by a reader whose install failed.: run: npx vitest run tests/integration/published-install-line.test.ts -t "does not declare"
No published surface names a version by hand where the package already declares one, so bumping the version is one edit and not four.: run: npx vitest run tests/integration/published-install-line.test.ts -t "second copy"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
