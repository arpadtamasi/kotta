---
id: T-01m120nshrccnwnejdmweft89z
title: The site shows the one command that sets Kotta up
status: review
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
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-27'
updated_at: '2026-08-27'
coverage:
  'The site shows one Kotta command where it showed a pinned third-party installer, and the command it shows is the one that also writes the rules file every agent in the project reads.':
    - BR-01m0zx29x1nvccpr4xwyhjr153
  No published surface instructs a reader to run a sequence that one Kotta command already performs.:
    - BR-01m0zx29x1nvccpr4xwyhjr153
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 0726d426aac018636cb2f5641cc3e0f4878b7fea
---
# T-01m120nshrccnwnejdmweft89z — The site shows the one command that sets Kotta up

## Outcome

A first visitor is shown the way in that Kotta actually has. The install block said:

```
npm install --global @arpadtamasi/kotta@0.10.0
npx skills@1.5.20 add arpadtamasi/kotta
```

The second line pins a third-party installer and installs the skills only. `kotta init` has
installed the same skills **and** written the workspace rules file — the one every agent in the
project reads — since before that page was written, and `README.md:135-145` says so. The site was
showing the weaker path under the words "verified setup".

## Scope

- The install block in `site/index.html`.
- The check that keeps a published surface from advertising a sequence Kotta already performs.

## Non-goals

- The README, which already names the shorter path and explains the alternative.
- The `skills` installer itself, which stays a legitimate route for hosts that use it; it is not
  what a first visitor should be shown.
- The slash-command lines below the install block, which are the guided path and are correct.

## Acceptance

- The site shows one Kotta command where it showed a pinned third-party installer, and the command it shows is the one that also writes the rules file every agent in the project reads.
- No published surface instructs a reader to run a sequence that one Kotta command already performs.

## Verification

- run: npx vitest run tests/integration/published-install-line.test.ts
- run: npx playwright test --config site/playwright.config.ts

## Constraints

- The block stays a copyable terminal transcript, not prose about what to run.

## Open decisions

None.

## Execution notes

Noticed by the operator reading the site's own install block on 2026-08-26 and asking whether the
second command was needed. It was not, and had not been for some time.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The site shows one Kotta command where it showed a pinned third-party installer, and the command it shows is the one that also writes the rules file every agent in the project reads. | run: npx vitest run tests/integration/published-install-line.test.ts -t "one Kotta command already does" — verified: exit 0 at 8699072 |
| No published surface instructs a reader to run a sequence that one Kotta command already performs. | run: npx playwright test --config site/playwright.config.ts -g "approved content task" — verified: exit 0 at 8699072 |

### Verification performed

The site shows one Kotta command where it showed a pinned third-party installer, and the command it shows is the one that also writes the rules file every agent in the project reads.: run: npx vitest run tests/integration/published-install-line.test.ts -t "one Kotta command already does"
No published surface instructs a reader to run a sequence that one Kotta command already performs.: run: npx playwright test --config site/playwright.config.ts -g "approved content task"

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
