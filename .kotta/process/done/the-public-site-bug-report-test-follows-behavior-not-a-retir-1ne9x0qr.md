---
id: T-01m0gk4c7gb0ycb4ae1ne9x0qr
title: 'The public-site bug-report test follows behavior, not a retired selector'
status: done
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
  - QA-01m0f0wn89pg0x4zymz08mh15w
  - EX-01m0ggd2q6n0vr7ks0skeh1264
branch: >-
  fix/T-01m0gk4c7gb0ycb4ae1ne9x0qr-the-public-site-bug-report-test-follows-behavior-not-a-retir
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-21'
coverage:
  'The public-site bug-report regression test verifies the currently shipped keyboard-reachable behavior instead of requiring a retired CSS selector, and the relevant integration and site suites pass.':
    - QA-01m0f0wn89pg0x4zymz08mh15w
    - EX-01m0ggd2q6n0vr7ks0skeh1264
approved_by: cli
approved_at: '2026-08-21T05:29:41.533Z'
approval_basis: 'CLI --approve: task.close'
assigned_agent: codex
worktree: .worktrees/T-01m0gk4c7gb0ycb4ae1ne9x0qr
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 83e495b677d9874a821d27639ba003cbbb446666
resolution: completed
---
## Outcome

The deploy gate verifies that the public bug-report action remains reachable without coupling the test to the landing page's retired mobile selector.

## Scope

Update the stale assertion in `tests/integration/bug-report.test.ts` to follow the current responsive CSS behavior. Do not change the public page's rendered design or reporting URL.

## Non-goals

No landing-page redesign, production-code change, or test weakening. Sandbox `listen EPERM` failures are environmental and handled by rerunning with local-network permission.

## Acceptance

- The public-site bug-report regression test verifies the currently shipped keyboard-reachable behavior instead of requiring a retired CSS selector, and the relevant integration and site suites pass.

## Verification

- Run the focused `bug-report.test.ts` integration test.
- Run `npm run test:site`.
- Run the full `npm test` suite with permission to bind local UI test ports.

## Constraints

Keep the test meaningful: it must still prove that narrow layouts hide ordinary section navigation without hiding the labelled reporting action.

## Open decisions

None.

## Execution notes

The first full pre-deploy run found one stale source-string assertion beside thirteen sandbox-only local-listener failures. Preserve the stronger Playwright behavior check already shipped.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The public-site bug-report regression test verifies the currently shipped keyboard-reachable behavior instead of requiring a retired CSS selector, and the relevant integration and site suites pass. | tests/integration/bug-report.test.ts now asserts the current responsive hide-and-explicit-restore behavior; focused suite passed 12/12, npm run test:site passed 6/6 at desktop and mobile widths, and the full socket-enabled npm test run passed 55/55 files with 386 passed and 1 skipped. |

### Verification performed

The public-site bug-report regression test verifies the currently shipped keyboard-reachable behavior instead of requiring a retired CSS selector, and the relevant integration and site suites pass.: tests/integration/bug-report.test.ts now asserts the current responsive hide-and-explicit-restore behavior; focused suite passed 12/12, npm run test:site passed 6/6 at desktop and mobile widths, and the full socket-enabled npm test run passed 55/55 files with 386 passed and 1 skipped.

### Deviations

None.

### Observations created

None.

### Known concerns

None.
