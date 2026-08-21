---
id: F-009
title: UI has no decisions surface — D-xxx records are invisible in the tool
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-27'
---
# F-009 — UI has no decisions surface — D-xxx records are invisible in the tool

## Observation

UI has no decisions surface — D-xxx records are invisible in the tool.

## Evidence

Discovered dogfooding the a-team UI on its own workspace (2026-07-27). Today's session produced four durable decisions (D-001..D-004), but the UI cannot show them: (1) /api/workspace (readWorkspace, src/commands/ui.ts) returns tickets/packages/findings only — no decisions array; (2) the Stage type is inbox|shape|packages|run|done — there is no decisions surface; (3) ENTITY_PATTERN (ui/src/App.tsx:38) linkifies O-/T-/F-/P- but NOT D-, so any D-xxx reference in ticket/finding markdown renders as dead text. The most consequential artifacts of a shaping session — the recorded decisions — are invisible in the very tool that manages the work. Suggest: expose decisions in the workspace payload, add a lightweight decisions list/detail (reuse the T-017 EntityDrawer), and include D- in the entity link pattern.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.

## Suggested direction

Reframe (operator, 2026-07-28): the D-records are not a change-log — they are the
project's **principles** (durable, cross-cutting standing rules: "identity =
ULID", "intake to base ref", "two gates", …). So they deserve a **dedicated,
first-class surface** — a **Principles page** in the nav — not a list buried
under an existing stage.

This is a control-plane concept, not decoration: the operator directs the agent
swarm through two durable-vs-per-task surfaces — **contracts** (per ticket, the
"how" of one task) and **principles** (standing, the "rules everything obeys").
Principles are the constitution the swarm runs under; the UI should make them as
visible and navigable as the work itself, and resolve D- links (fold into F-012's
entity-link work). Ties to the positioning: contracts + principles = how a human
steers a swarm without supervising it.

Completion (operator, 2026-07-28): a decision's **scope** decides its home, so the
decisions surface is **two-fold**, not one page:
- **principle** (global, cross-cutting) → the dedicated **Principles page**;
- **entity-scoped** decision (made for a specific ticket/finding/package) → shown
  **on that entity's detail**, where it belongs — not on the global page.
A ticket's resolved "Open decisions" are exactly its entity-scoped D-records
(cf. D-004: an open question → a decision, scoped to whatever raised it). So the
UI needs both: a Principles page for global rules, and per-entity decision
attachment in the T-017 drawer.
