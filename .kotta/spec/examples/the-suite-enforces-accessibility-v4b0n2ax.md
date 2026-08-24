---
id: EX-01m0f0wn8azg7m6btvv4b0n2ax
form: example
title: "The suite enforces accessibility"
subjects:
  - QA-01m0f0wn89pg0x4zymz08mh15w
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

The board and the onboarding site at every supported breakpoint.

## When

The Playwright suite drives keyboard navigation and runs automated accessibility checks.

## Then

Focus stays visible, controls stay reachable and named, and no serious or critical violation is found - or the build fails.
