---
id: F-010
title: The local UI is visually overcrowded — needs a density/hierarchy pass
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-27'
---
# F-010 — The local UI is visually overcrowded — needs a density/hierarchy pass

## Observation

The local UI is visually overcrowded — needs a density/hierarchy pass.

## Evidence

Human observation while viewing the a-team UI on its own workspace (2026-07-27): the interface is very cluttered. The single-page layout renders the left rail, the always-on needs-you strip, the current stage (dense entity rows), and the collapsible chat dock at the same time; entity rows carry many inline chips (id, type, priority, risk, package, depends_on, plus per-row action buttons). The result reads as overcrowded. Warrants a density/hierarchy pass: more breathing room, progressive disclosure, and/or fewer simultaneously-visible surfaces. Note: ui/UX-SPEC.md §5 explicitly targets 'density over poster', so this is a tension between intended information density and actual visual overload — not a request to add ornament, but to make the dense information legible.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
