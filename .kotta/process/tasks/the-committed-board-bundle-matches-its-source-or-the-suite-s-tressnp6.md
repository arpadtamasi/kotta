---
id: T-01m1ac3k3h718pjf70tressnp6
title: >-
  The committed board bundle matches its source, or the suite says which file
  does not
status: done
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
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
branch: >-
  feat/T-01m1ac3k3h718pjf70tressnp6-the-committed-board-bundle-matches-its-source-or-the-suite-s
pull_request: null
created_at: '2026-08-30'
updated_at: '2026-08-31'
coverage:
  'A committed bundle that no longer matches a build of its source fails the suite, naming every file that differs, is missing or is extra, and the one command that regenerates it.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'The check builds the source itself into a scratch directory, so it cannot pass because the suite was run without building first, and it never writes to the committed bundle.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
  'The bundle committed today is proved to match its source, by that same build rather than by assertion.':
    - IF-01m0f0wn898ggsdxa0kh6t6tnw
assigned_agent: claude
worktree: .worktrees/T-01m1ac3k3h718pjf70tressnp6
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: e56e81cd9f06266a75d6a7b566b5cb21f582e64e
review_commit: 1a05b7d545f0a64e335c00435553d42207522b03
resolution: completed
approved_by: cli
approved_at: '2026-08-31T07:04:37.953Z'
approval_basis: 'CLI --approve: task.close'
---
# T-01m1ac3k3h718pjf70tressnp6 — The committed board bundle matches its source, or the suite says which file does not

## Outcome

`ui-dist/` is a tracked build artifact — four files — and `kotta ui` serves it, so a checkout runs
the committed bundle and not the source. Nothing compares the two. Measured on 2026-08-29: after
`ui/src/App.tsx` was corrected, the tracked bundle still carried the removed `task sign` string, and
the fix was invisible to anyone running the board from the checkout until `npm run build:ui` was run
by hand and the result committed.

The published package is safe by another mechanism — `prepack` runs the full build — so the
exposure is checkouts, which is exactly where this project's agents and its board run. A correction
that reaches the source and not the served page has not reached the reader.

## Scope

- A suite check that builds `ui/` into a scratch directory and compares the result, file by file,
  with the tracked `ui-dist/`.
- Naming the difference: which file differs, which is missing, which is extra, and the command that
  fixes it.
- The comparison itself has to be testable, so drift can be proved to fail rather than assumed to.

## Non-goals

- Untracking the bundle. Carrying it is the promise — a checkout runs the board without a build
  step — so the answer is a check, not a removal.
- `site-dist/`. It is built by CI on every push and never committed; it has no drift of this kind.
- Regenerating the bundle automatically. A check that repairs what it measures cannot fail, and a
  committed artifact changing under a test run is worse than the drift.
- Making the bundle reproducible. It already is: two consecutive builds produce byte-identical
  files with identical content-hashed names. If that ever stops being true, this check is where it
  will be noticed.

## Acceptance

- A committed bundle that no longer matches a build of its source fails the suite, naming every file that differs, is missing or is extra, and the one command that regenerates it.
- The check builds the source itself into a scratch directory, so it cannot pass because the suite was run without building first, and it never writes to the committed bundle.
- The bundle committed today is proved to match its source, by that same build rather than by assertion.

## Verification

- run: npx vitest run tests/integration/board-bundle.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The check never writes into `ui-dist/`, and leaves the working tree as it found it.
- It depends on no network and no prior build step of its own.
- One build, not two: a `vite build` of `ui/` takes about four seconds, and a check that costs more
  than the drift does gets switched off.

## Open decisions

None.

## Execution notes

`ui/vite.config.ts` writes to `../ui-dist` with `emptyOutDir`; `vite build --outDir <scratch>
--emptyOutDir` redirects it without touching the tracked copy. Verified on 2026-08-30: two
consecutive builds and a `diff -r` against `ui-dist/` are identical, filenames included. The
comparison belongs in a helper the test can drive against a deliberately mutated copy — otherwise
the failing case is never exercised and only the passing one is.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A committed bundle that no longer matches a build of its source fails the suite, naming every file that differs, is missing or is extra, and the one command that regenerates it. | run: npx vitest run tests/integration/board-bundle.test.ts -t "reported by name, with the command\|reported as missing\|reported as extra" — verified: exit 0 at 1a05b7d |
| The check builds the source itself into a scratch directory, so it cannot pass because the suite was run without building first, and it never writes to the committed bundle. | run: npx vitest run tests/integration/board-bundle.test.ts -t "builds the source itself\|runner's environment does not reach" — verified: exit 0 at 1a05b7d |
| The bundle committed today is proved to match its source, by that same build rather than by assertion. | run: npx vitest run tests/integration/board-bundle.test.ts -t "is what a build of ui/ produces" — verified: exit 0 at 1a05b7d |

### Verification performed

A committed bundle that no longer matches a build of its source fails the suite, naming every file that differs, is missing or is extra, and the one command that regenerates it.: run: npx vitest run tests/integration/board-bundle.test.ts -t "reported by name, with the command|reported as missing|reported as extra"
The check builds the source itself into a scratch directory, so it cannot pass because the suite was run without building first, and it never writes to the committed bundle.: run: npx vitest run tests/integration/board-bundle.test.ts -t "builds the source itself|runner's environment does not reach"
The bundle committed today is proved to match its source, by that same build rather than by assertion.: run: npx vitest run tests/integration/board-bundle.test.ts -t "is what a build of ui/ produces"

### Deviations

None.

### Observations created

Not declared.

### Known concerns

Dogfooded against the real repository rather than only against fixtures: changing one string in ui/src/App.tsx without rebuilding made the suite fail, naming the new file, the stale one and index.html, with 'npm run build:ui' as the fix; reverted, tree clean. One real staleness fails three checks rather than one — the three that each assert the committed copy matches the built one. That is honest duplication, not noise, and the four simulated-drift cases are independent of it. The bundle's reproducibility is now load-bearing: two builds produce byte-identical, identically named files today, and if that ever stops being true this check is where it surfaces.
