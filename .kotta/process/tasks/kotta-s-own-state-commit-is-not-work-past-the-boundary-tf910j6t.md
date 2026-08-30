---
id: T-01m19b26j3z4vc6y8ntf910j6t
title: Kotta's own state commit is not work past the boundary
status: defined
origin: human
types:
  - bug
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
branch: null
pull_request: null
created_at: '2026-08-30'
updated_at: '2026-08-30'
coverage:
  A commit whose whole diff is Kotta's own process records is not reported as work past the submission.:
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
    - BR-01m0pw5bc7b1rkg5dct5qgdkmb
  'A commit that touches anything outside those records is still reported, including one that touches both.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
---
## Outcome

The boundary caught its own submission:

```
submitted for review, and 1 commit landed on 'claude/graft-kottara-837884'
after the submission at 8148786 (4465fe4).
```

`4465fe4` is `chore(kotta): submit … for review` — Kotta writing its own lifecycle event, index and
task file. Its entire diff is inside `.kotta/process/`. Nothing continued; the submission recorded
itself, one commit after the commit it recorded.

Where the control plane and the execution branch are the same branch — the adopted single-checkout
shape, which is what a hosted session always has — this happens on *every* submission. A report
that fires on every task is a report nobody reads, which is the failure the rendering rule exists
to prevent.

## Scope

- Which commits count as work past the submission.

## Non-goals

- The boundary itself, its two directions, and where it is reported, all unchanged.
- Judging what a commit contains beyond which paths it touches. A commit that touches code is work,
  whatever the code says.

## Acceptance

- A commit whose whole diff is Kotta's own process records is not reported as work past the submission.
- A commit that touches anything outside those records is still reported, including one that touches both.

## Verification

- run: npx vitest run tests/integration/submission-boundary.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- The exclusion is by path, read from Git, and it is the process namespace alone: a commit touching
  `spec/` is a change to the agreement and stays reported.

## Open decisions

None.

## Execution notes

Found by the feature on itself, minutes after it was submitted. It is a separate task rather than an
amendment to that one because the rule it enforces is exactly that a submitted task is closed to
further work.
