---
id: T-01m0j2vr1s33cgsq85xjx1fspg
title: The public page names the situations Kotta is entered from
status: review
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

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The public page names the three situations Kotta is entered from — new software, a rewrite of an existing system, and a codebase already under way — each in at most two sentences. | site/index.html carries a section with data-unit="arrivals" between the problem and mechanism sections, headed 'Three ways in.', with a one-sentence lede stating the model and three entries: 'New software' (spec to task to code), 'A legacy rewrite' (code to spec to task to code) and 'A codebase already under way' (running system to observation to spec to task to code). Each entry is a path line plus two sentences. site/tests/site.spec.ts asserts the heading is visible and that .arrival-list has exactly three entries. The band introduces no decision entity. The desktop full-page screenshot produced by the suite shows it rendering between 'AI can execute more work than you can continuously observe.' and 'The agreement becomes executable.' |
| The first viewport still carries the offer, a primary action and the control mechanism at 1440x900, and the page keeps its responsive behaviour, keyboard access, JavaScript-free readability and freedom from serious or critical accessibility violations. | npm run test:site passes 6/6 after the change, including 'desktop first viewport carries the offer, action and control mechanism', the axe scans at 375x812 and 1440x900 with no serious or critical violations, the horizontal-overflow check at both widths, the skip-link focus and reduced-motion assertions, the two keyboard-reachable bug-report links, and 'remains readable without JavaScript'. The first run of the path line used white-space: nowrap and failed the 375px overflow check; the rule was removed so the line wraps, and the check passes. npm run build:site succeeds. The section adds no script and reflows to one column below 860px. Note on the environment rather than the change: this container's Playwright could not launch until the pre-installed Chromium at /opt/pw-browsers was linked to the headless-shell path this Playwright version expects; that is a container-side link, not a repository change, and no assertion was weakened to make the run pass. |

### Verification performed

The public page names the three situations Kotta is entered from — new software, a rewrite of an existing system, and a codebase already under way — each in at most two sentences.: site/index.html carries a section with data-unit="arrivals" between the problem and mechanism sections, headed 'Three ways in.', with a one-sentence lede stating the model and three entries: 'New software' (spec to task to code), 'A legacy rewrite' (code to spec to task to code) and 'A codebase already under way' (running system to observation to spec to task to code). Each entry is a path line plus two sentences. site/tests/site.spec.ts asserts the heading is visible and that .arrival-list has exactly three entries. The band introduces no decision entity. The desktop full-page screenshot produced by the suite shows it rendering between 'AI can execute more work than you can continuously observe.' and 'The agreement becomes executable.'
The first viewport still carries the offer, a primary action and the control mechanism at 1440x900, and the page keeps its responsive behaviour, keyboard access, JavaScript-free readability and freedom from serious or critical accessibility violations.: npm run test:site passes 6/6 after the change, including 'desktop first viewport carries the offer, action and control mechanism', the axe scans at 375x812 and 1440x900 with no serious or critical violations, the horizontal-overflow check at both widths, the skip-link focus and reduced-motion assertions, the two keyboard-reachable bug-report links, and 'remains readable without JavaScript'. The first run of the path line used white-space: nowrap and failed the 375px overflow check; the rule was removed so the line wraps, and the check passes. npm run build:site succeeds. The section adds no script and reflows to one column below 860px. Note on the environment rather than the change: this container's Playwright could not launch until the pre-installed Chromium at /opt/pw-browsers was linked to the headless-shell path this Playwright version expects; that is a container-side link, not a repository change, and no assertion was weakened to make the run pass.

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
