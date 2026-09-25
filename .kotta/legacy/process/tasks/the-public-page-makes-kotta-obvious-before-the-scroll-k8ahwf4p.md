---
id: T-01m0ggf64xdh1644m2k8ahwf4p
title: The public page makes Kotta obvious before the scroll
status: done
origin: human
types:
  - feature
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - US-01m0ggd2pyczw6k9206zregq59
  - EX-01m0ggd2q6n0vr7ks0skeh1264
  - QA-01m0f0wn89pg0x4zymz08mh15w
branch: >-
  feat/T-01m0ggf64xdh1644m2k8ahwf4p-the-public-page-makes-kotta-obvious-before-the-scroll
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
coverage:
  'At 1440×900, the first viewport states Kotta''s offer, exposes an install or GitHub action, and demonstrates the path from intent through execution to evidence-backed human acceptance.':
    - US-01m0ggd2pyczw6k9206zregq59
    - EX-01m0ggd2q6n0vr7ks0skeh1264
  'The page uses Graft''s direct marketing logic inside Kotta''s existing visual language, with concrete product mechanics and no unsupported commercial, customer, or benchmark claims.':
    - US-01m0ggd2pyczw6k9206zregq59
    - EX-01m0ggd2q6n0vr7ks0skeh1264
  'The shipped page remains responsive, keyboard-usable, readable without JavaScript, free of horizontal overflow, and free of serious or critical axe violations at desktop and mobile widths.':
    - EX-01m0ggd2q6n0vr7ks0skeh1264
    - QA-01m0f0wn89pg0x4zymz08mh15w
approved_by: cli
approved_at: '2026-08-20T21:50:34.301Z'
approval_basis: 'CLI --approve: task.close'
assigned_agent: codex
worktree: .worktrees/T-01m0ggf64xdh1644m2k8ahwf4p
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 9f301f159ffc81ab53a598800a9ca92a90f56f20
resolution: completed
---
## Outcome

The public GitHub Pages site makes Kotta obvious and desirable before the first scroll. It borrows the Graft README's marketing discipline — sharp claim, immediate mechanism, short path to action, concrete proof — while remaining unmistakably Kotta.

## Scope

Reshape the public landing page in `site/index.html` and `site/styles.css`, including its copy hierarchy, first viewport, product-mechanism demonstration, install/GitHub actions, responsive behavior, and Playwright assertions. Preserve the existing Kotta mark, palette, typography family, square geometry, static HTML delivery, and truthful product constraints.

## Non-goals

No redesign of the local board. No copied Graft brand, layout, wording, benchmark numbers, or imagery. No fabricated customers, testimonials, adoption metrics, performance claims, hosted-service claims, or capabilities. The LinkedIn screenshot supplied in chat is not a design reference.

## Acceptance

- At 1440×900, the first viewport states Kotta's offer, exposes an install or GitHub action, and demonstrates the path from intent through execution to evidence-backed human acceptance.
- The page uses Graft's direct marketing logic inside Kotta's existing visual language, with concrete product mechanics and no unsupported commercial, customer, or benchmark claims.
- The shipped page remains responsive, keyboard-usable, readable without JavaScript, free of horizontal overflow, and free of serious or critical axe violations at desktop and mobile widths.

## Verification

- Run `npm run test:site`.
- Capture and inspect the page at 1440×900 and 375×812 in one bounded visual pass, fix material issues once, then confirm.
- Run the Impeccable detector once over the changed site files.

## Constraints

Treat the Graft repository as a content-architecture and marketing-strength reference only. Keep factual product copy grounded in `PRODUCT.md`, `README.md`, and shipped behavior. Keep the page useful with JavaScript disabled and avoid new runtime dependencies.

## Open decisions

None.

## Execution notes

The user explicitly rejected the supplied LinkedIn screenshot as a visual reference. Amplify the existing Kotta system rather than replacing its visual world.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| At 1440×900, the first viewport states Kotta's offer, exposes an install or GitHub action, and demonstrates the path from intent through execution to evidence-backed human acceptance. | site/tests/site.spec.ts:45 asserts the h1, Install Kotta, View on GitHub, task record, and Human decision required are visible and end within y=900; npm run test:site passed; desktop-full.png visually confirms the complete first viewport. |
| The page uses Graft's direct marketing logic inside Kotta's existing visual language, with concrete product mechanics and no unsupported commercial, customer, or benchmark claims. | site/index.html renders direct offer/action/mechanism copy and a truthful synthetic T-042 task record; site/styles.css uses Kotta's Archivo, archive paper, repository ink, signal red, square geometry, and visible rules; source and finish review found no unsupported commercial, customer, or benchmark claims. |
| The shipped page remains responsive, keyboard-usable, readable without JavaScript, free of horizontal overflow, and free of serious or critical axe violations at desktop and mobile widths. | npm run test:site passed 6/6 at 1440×900 and 375×812, including scroll-width, target/link, keyboard focus, reduced motion, JavaScript-disabled readability, and axe serious/critical checks; desktop-full.png and mobile-full.png were visually inspected and confirmed. |

### Verification performed

At 1440×900, the first viewport states Kotta's offer, exposes an install or GitHub action, and demonstrates the path from intent through execution to evidence-backed human acceptance.: site/tests/site.spec.ts:45 asserts the h1, Install Kotta, View on GitHub, task record, and Human decision required are visible and end within y=900; npm run test:site passed; desktop-full.png visually confirms the complete first viewport.
The page uses Graft's direct marketing logic inside Kotta's existing visual language, with concrete product mechanics and no unsupported commercial, customer, or benchmark claims.: site/index.html renders direct offer/action/mechanism copy and a truthful synthetic T-042 task record; site/styles.css uses Kotta's Archivo, archive paper, repository ink, signal red, square geometry, and visible rules; source and finish review found no unsupported commercial, customer, or benchmark claims.
The shipped page remains responsive, keyboard-usable, readable without JavaScript, free of horizontal overflow, and free of serious or critical axe violations at desktop and mobile widths.: npm run test:site passed 6/6 at 1440×900 and 375×812, including scroll-width, target/link, keyboard focus, reduced motion, JavaScript-disabled readability, and axe serious/critical checks; desktop-full.png and mobile-full.png were visually inspected and confirmed.

### Deviations

None.

### Observations created

None.

### Known concerns

The Impeccable detector reports advisory-only public-site typography scale differences from the compact Console v2 ramp; the expanded fluid scale is intentional for this marketing surface and remains within the craft and accessibility limits.
