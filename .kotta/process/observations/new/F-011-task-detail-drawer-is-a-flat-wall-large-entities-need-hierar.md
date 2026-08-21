---
id: F-011
title: >-
  Task detail drawer is a flat wall — large entities need hierarchy (finding
  detail reads far better)
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-27'
---
# F-011 — Task detail drawer is a flat wall — large entities need hierarchy (finding detail reads far better)

## Observation

Task detail drawer is a flat wall — large entities need hierarchy (finding detail reads far better).

## Evidence

Dogfooding the a-team UI (2026-07-27): opening a FINDING in the T-017 detail drawer reads well, but opening a TASK is much worse. Root cause: the EntityDrawer renders every section as a flat, equal-weight list (kicker heading + markdown). Findings have few short sections (observation/evidence/impact/confidence/disposition), so the flat dump is fine. Tasks have many long sections (outcome, scope, non-goals, acceptance, verification, constraints, open decisions, execution notes, plus profile sections — e.g. a ui-profile task carries user_goal + all states + a11y), so the same flat dump becomes an overwhelming wall with no hierarchy or navigation. This is the deferred follow-up already named in T-017's non-goals: the task detail needs the D-004 per-entity brief — outcome/acceptance surfaced first, intrinsic + pre-flight ready status, acceptance↔evidence at review, progressive disclosure of the long tail. Sibling of F-010 (overall clutter).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.

## Suggested direction

Interaction (operator, 2026-07-27): sections should expand **in place, downward** —
collapsible/accordion, compact-by-default (headers only), the operator opens what
they need. Not a flat all-open wall, and not a separate side panel for the long
tail. Pairs with the D-004 hierarchy: outcome/acceptance/ready-status shown up
top by default; scope/non-goals/constraints/execution-notes/profile-states
collapsed below and expanded on demand.
