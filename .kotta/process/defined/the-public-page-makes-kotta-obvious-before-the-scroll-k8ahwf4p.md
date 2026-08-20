---
id: T-01m0ggf64xdh1644m2k8ahwf4p
title: The public page makes Kotta obvious before the scroll
status: defined
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
branch: null
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
approved_at: '2026-08-20T21:26:43.165Z'
approval_basis: 'CLI --approve: task.sign'
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
