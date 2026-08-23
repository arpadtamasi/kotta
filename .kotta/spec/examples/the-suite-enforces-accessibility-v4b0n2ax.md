---
id: EX-01m0f0wn8azg7m6btvv4b0n2ax
form: example
title: "The suite enforces accessibility"
subjects:
  - QA-01m0f0wn89pg0x4zymz08mh15w
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

The board and the onboarding site at every supported breakpoint.

## When

The Playwright suite drives keyboard navigation and runs automated accessibility checks.

## Then

Focus stays visible, controls stay reachable and named, and no serious or critical violation is found - or the build fails.
