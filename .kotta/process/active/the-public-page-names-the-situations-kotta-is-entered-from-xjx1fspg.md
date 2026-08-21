---
id: T-01m0j2vr1s33cgsq85xjx1fspg
title: The public page names the situations Kotta is entered from
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
  - US-01m0j2txqj33mjbyp0rrmwswc7
  - EX-01m0j2txqqhxvseynysnpj28wd
  - QA-01m0f0wn89pg0x4zymz08mh15w
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-21'
coverage:
  'The public page names the three situations Kotta is entered from — new software, a rewrite of an existing system, and a codebase already under way — each in at most two sentences.':
    - US-01m0j2txqj33mjbyp0rrmwswc7
    - EX-01m0j2txqqhxvseynysnpj28wd
  'The first viewport still carries the offer, a primary action and the control mechanism at 1440x900, and the page keeps its responsive behaviour, keyboard access, JavaScript-free readability and freedom from serious or critical accessibility violations.':
    - EX-01m0j2txqqhxvseynysnpj28wd
    - QA-01m0f0wn89pg0x4zymz08mh15w
approved_by: cli
approved_at: '2026-08-21T12:05:11.086Z'
approval_basis: 'CLI --approve: task.request-changes'
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 7944aefc61eaf0df21a95470c7ea2ee885272027
---
## Outcome

A visitor who has read the claim in the first viewport of the public page finds their own project
named a moment later, in three short arrivals rather than an explanation. The long treatment stays
in `README.md`; the page names, the README explains.

## Scope

Add one section to `site/index.html` below the problem section, naming the three situations Kotta is
entered from, each in at most two sentences. Style it in `site/styles.css` with the existing tokens,
type scale and square geometry. Update `site/tests/site.spec.ts` for the new section's presence and
position, and keep every assertion that already pins the first viewport, the copy above it, the
comparison table and the install block.

## Non-goals

No change to `README.md`, to the CLI, or to any product behaviour. No new claim, metric, customer,
testimonial or hosted-service capability. No new colour, font family or corner radius. No change to
the hero copy, the problem section, the mechanism steps, the comparison table or the install block.
No JavaScript added to the page.

## Acceptance

- The public page names the three situations Kotta is entered from — new software, a rewrite of an existing system, and a codebase already under way — each in at most two sentences.
- The first viewport still carries the offer, a primary action and the control mechanism at 1440x900, and the page keeps its responsive behaviour, keyboard access, JavaScript-free readability and freedom from serious or critical accessibility violations.

## Verification

- `npm run test:site` — the Playwright suite, including the desktop first-viewport test, the axe
  scan at mobile and desktop widths, the no-JavaScript test and the horizontal-overflow check.
- The section-order assertion in `site/tests/site.spec.ts` names the new section in its position.
- `npm run build:site` succeeds.
- `git diff -- site/index.html` shows no change to the hero, problem, mechanism, comparison or
  install markup.

## Constraints

- The page stays static HTML and CSS with no client-side script.
- Only existing design tokens from `DESIGN.md` are used; no new colour, radius or font family.
- The new copy is short by design. Two sentences per situation is a limit, not a target.
- Every claim is traceable to behaviour that exists in the repository.

## Open decisions

None.

## Execution notes

- `site/tests/site.spec.ts` asserts `[data-unit]` has exactly six entries in a fixed order. The new
  section adds a seventh, so that assertion changes by design; this is the one test edit this task
  makes, and it is a structural change rather than a weakened check.
- The same three situations are already written at length in `README.md` under "Where it fits". The
  page must not repeat that text; it names what the README explains.
