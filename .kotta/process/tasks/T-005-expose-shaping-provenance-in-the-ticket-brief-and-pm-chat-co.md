---
id: T-005
title: Expose shaping provenance in the ticket Brief and PM chat context
status: backlog
origin: human
types:
  - feature
profiles:
  - ui
priority: medium
risk: medium
batch: P-001
depends_on:
  - T-004
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-005 — Expose shaping provenance in the ticket Brief and PM chat context

## Outcome

When a PM opens a shaped or augmented ticket, the Brief shows exactly which findings produced it and the ticket chat receives their full evidence. Existing tickets without provenance render normally, and backlog tickets cannot accidentally start implementation from the refinement UI.

## User goal

Understand why this ticket exists, inspect every source finding, and refine its execution contract without switching to the global shaping conversation or losing provenance.

## Entry point

Open any ticket drawer from the lifecycle board, package view, finding link, or Needs You list; select Brief or Chat.

## Default state

Brief shows Outcome, Scope, Acceptance, Verification, then a `Source findings` block with IDs, titles, disposition relationship, and evidence links. Chat context includes the same source evidence and shape rationale.

## Loading state

The drawer skeleton preserves layout while workspace/source data loads; chat send remains disabled until the ticket and its sources are available.

## Empty state

Legacy or manually created tickets with no provenance show `No source findings recorded` without implying an error.

## Error state

Missing or unreadable referenced finding displays an explicit broken-reference row and disables provenance-dependent chat submission; workspace validation guidance is shown.

## Success state

All source findings are visible and openable, chat clearly identifies the selected ticket and sources, and refinement can proceed while lifecycle remains backlog.

## Disabled state

On backlog tickets, `Start implementation` is hidden or disabled with guidance to complete refinement, validate, and mark ready. Chat is disabled only for missing context or unavailable agent.

## Responsive behaviour

Source rows wrap without horizontal scrolling; IDs and disposition remain scannable on narrow drawers. Long evidence is collapsed with an accessible expand control.

## Keyboard and focus behaviour

Tabs, source links, expand controls, and chat composer are keyboard reachable in logical order. Opening/closing nested source detail preserves or restores focus.

## Accessibility expectations

Tabs expose selected state; broken refs and disabled actions have text explanations; source relationship is not color-only; controls have visible focus and accessible names.

## Visual reference

Use the existing ticket drawer/Brief visual language. Add a compact provenance section rather than a new page, global chat, graph visualization, or dashboard.

## Scope

- Workspace API/read model exposes normalized source findings and shape events from T-004.
- Brief renders source list, evidence links, rationale/plan metadata where useful, and broken-reference states.
- Ticket-chat prompt includes complete finding observations/evidence plus ticket contract and instructs refinement, not implementation, while backlog.
- Backlog implementation CTA follows the ready gate.

## Non-goals

- Global portfolio chat, finding chat, package chat, clustering, or plan Apply.
- Editing provenance from the UI.
- Redesign of the lifecycle board or ticket drawer.

## Acceptance

- A ticket with three source findings shows all three with correct IDs/titles and navigable evidence.
- The first ticket-chat request includes complete evidence for all normalized sources and shape rationale.
- Legacy no-source tickets render a benign empty state.
- Broken references are explicit and never silently omitted from chat context.
- Backlog tickets cannot trigger implementation; ready tickets retain the existing start path.
- Existing board, tabs, package membership, and non-shaped ticket behavior regress neither visually nor functionally.

## Verification

- Component tests cover 0/1/many sources, split-source reuse, long evidence, and broken references.
- API/prompt test snapshots the exact context sent for a T-022-style three-finding ticket.
- Keyboard/accessibility checks cover tabs, source expansion, links, disabled CTA, and focus restoration.
- Visual QA at desktop and narrow drawer widths; regression test existing ticket drawer flows.

## Constraints

Do not persist chat history as canonical state. Do not read arbitrary paths from provenance links; resolve validated entity IDs inside the workspace.

## Open decisions

None.

## Execution notes

Implement after T-004. Use the current drawer components and source endpoint rather than adding a parallel data path.
