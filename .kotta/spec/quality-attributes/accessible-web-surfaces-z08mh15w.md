---
id: QA-01m0f0wn89pg0x4zymz08mh15w
form: quality-attribute
title: "Accessible web surfaces"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Source

A keyboard or assistive-technology user operating the board or the onboarding site.

## Stimulus

Navigating and reading every supported layout, including reduced-motion preferences.

## Environment

The responsive breakpoints the surfaces ship, light of any mouse.

## Artifact

The local board (kotta ui) and the public onboarding site.

## Response

Keyboard-usable throughout, visible focus preserved, semantic structure and accessible names exposed, state never communicated by color alone.

## Measure

No serious or critical automated accessibility violations across supported layouts, enforced by the Playwright + axe suite.
