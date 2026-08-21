---
id: T-01m0hrtpfkq3bx3mmd25073me5
title: >-
  The GitHub repository page says what Kotta is for before it says how to
  install it
status: active
origin: human
types:
  - docs
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
spec:
  - US-01m0hrxc4qmhhrpwz2f288np0t
  - EX-01m0hrxc4xrya8gfs08k289z5r
  - QA-01m0f0wn89h953x7kv3yykfept
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-21'
coverage:
  'A reader of the rendered repository page can state what Kotta is for, recognise whether they are the intended reader, and name something Kotta deliberately does not do, before the page presents an install command.':
    - US-01m0hrxc4qmhhrpwz2f288np0t
    - EX-01m0hrxc4xrya8gfs08k289z5r
  The install path on the repository page names the version the package publishes and gives the same skills-install instruction as the public page.:
    - EX-01m0hrxc4xrya8gfs08k289z5r
    - QA-01m0f0wn89h953x7kv3yykfept
  Compatibility and migration reference material remains complete on the page and no longer precedes the product claim.:
    - US-01m0hrxc4qmhhrpwz2f288np0t
    - EX-01m0hrxc4xrya8gfs08k289z5r
approved_by: cli
approved_at: '2026-08-21T11:40:46.316Z'
approval_basis: 'CLI --approve: task.request-changes'
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: c16571e7aec6a2e79ff611ed301d28bc2ba8ada8
---
## Outcome

`README.md` — the view GitHub renders as the repository page — answers what Kotta is for, who it is
for, and what it deliberately does not do, before it answers how to install it. The page keeps every
sentence it has today; what changes is the order, the length of the opening, and two facts that are
currently wrong.

## Scope

Restructure `README.md`:

1. Add a short opening that states the situation Kotta is for, the three things it keeps intact, and
   what it asks of the reader in return.
2. Add a short list of what the reader gets, naming the real mechanism behind each item.
3. Promote the existing `## Scope` section — the honest limits — from the end of the file to the
   opening, as "What Kotta is not".
4. Move `## Renamed from A-Team` and `## Migrating the vocabulary` from the third screen to the
   reference part of the page, keeping their text intact.
5. Trim the install section to the path a newcomer walks, moving the agent-rules and `--link-agents`
   detail into a subsection.
6. Correct the advertised install version to the version this package publishes, and align the
   skills-install instruction with the one the public site gives.

## Non-goals

No change to `site/`, to the local board, or to any product behaviour. No new product claim, metric,
customer, testimonial, or hosted-service capability. No deletion of compatibility, migration,
maintainer-release or CLI reference material. No rewrite of the `## Report a bug` section. No change
to the repository's GitHub description, which is a separate surface outside the repository tree.

## Acceptance

- A reader of the rendered repository page can state what Kotta is for, recognise whether they are the intended reader, and name something Kotta deliberately does not do, before the page presents an install command.
- The install path on the repository page names the version the package publishes and gives the same skills-install instruction as the public page.
- Compatibility and migration reference material remains complete on the page and no longer precedes the product claim.

## Verification

- `grep -n '^#' README.md` shows the opening sections before the install section, and the
  compatibility and migration sections after the reference material.
- `grep -n 'kotta@' README.md site/index.html` and `grep '"version"' package.json` report the same
  version.
- `git diff origin/main -- README.md` shows no removed sentence outside the sections this task moves
  or rewrites, and no change inside `## Report a bug`.
- `npm test` passes, including `tests/integration/bug-report.test.ts`, whose `documentation` block
  asserts the `## Report a bug` text with its exact line wrapping.
- `npm run typecheck` passes.
- Reading the first two screens of the rendered file answers the three questions in the first
  acceptance condition without scrolling past them.

## Constraints

- `## Report a bug` stays byte for byte identical. Its wording, including line breaks, is asserted
  by `tests/integration/bug-report.test.ts`.
- No test assertion is edited. A test that has to change marks a behaviour change this task does not
  make.
- Claims are traceable to behaviour that exists in the repository or to `PRODUCT.md`. Almost every
  sentence in the new opening already exists somewhere in the repository; the work is placement.
- The voice stays restrained: no superlatives, no invented numbers, no competitor naming.

## Open decisions

None.

## Execution notes

- The spec did not previously promise anything about the repository page; the public-page story
  covers `site/` only. `US-01m0hrxc4qmhhrpwz2f288np0t` and `EX-01m0hrxc4xrya8gfs08k289z5r` were added
  to state that promise before this task was defined.
- Two defects are corrected in passing because they sit inside the path this task rewrites: the page
  advertises `@arpadtamasi/kotta@0.6.0` while the package publishes 0.7.0, and it installs skills
  with `kotta sync` while the public site uses `npx skills add`. The underlying cause of the first —
  the version is hardcoded in several files — is a separate open observation and is not fixed here.
