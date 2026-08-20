---
id: T-01m0gk4c7gb0ycb4ae1ne9x0qr
title: 'The public-site bug-report test follows behavior, not a retired selector'
status: backlog
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
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
coverage:
  'The public-site bug-report regression test verifies the currently shipped keyboard-reachable behavior instead of requiring a retired CSS selector, and the relevant integration and site suites pass.':
    - QA-01m0f0wn89pg0x4zymz08mh15w
    - EX-01m0ggd2q6n0vr7ks0skeh1264
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
