---
id: T-017
title: UI has no dedicated detail view for tickets or findings (only packages do)
status: done
origin: observation
types:
  - feature
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: feat/T-017-ui-has-no-dedicated-detail-view-for-tickets-or-findings-only
pull_request: null
created_at: '2026-07-27'
updated_at: '2026-07-27'
source_observation: F-005
assigned_agent: claude
resolution: completed
---
# T-017 — UI has no dedicated detail view for tickets or findings (only packages do)

## Outcome

Clicking any entity id (ticket, finding, or package) opens a detail drawer that
renders the entity's full content — every section, plus its key metadata — from
the data already in `/api/workspace`. The operator can finally read a task's
whole contract without opening the raw markdown file.

## Scope

- A single `EntityDrawer` in `ui/src/App.tsx`, reusing the existing right-side
  drawer pattern (`overlay overlay--right` + `aside.drawer`) and `MarkdownContent`.
- Wire `openEntity(id)` to open the drawer for ticket/finding/package (replacing
  the current bare stage-navigation); unknown ids keep the raw `SourceDrawer`.
- Header (id, title), a metadata chip row per kind (ticket: status/priority/risk/
  type/package/depends_on/branch/blocked; finding: type/severity/confidence/
  status/discovered_during/disposition; package: kind/status/members/execution),
  entity-id chips clickable, then all `sections` rendered in document order.
- Show any state-drift diagnostic for the entity inline (ties to T-016 theme).
- Footer: Discuss (opens the chat dock) and Raw source.

## Non-goals

- The rich per-entity brief from D-004 (channel tags, intrinsic/pre-flight ready
  status, acceptance↔evidence table, goal success-definition/assess) — a
  follow-up once the plain detail view lands.
- Editing from the drawer; new backend endpoints. Read-only, existing data.

## Acceptance

- Clicking a ticket id opens a drawer showing its title, metadata chips, and
  every section (outcome, scope, acceptance, verification, …) rendered as
  markdown.
- Clicking a finding id shows its evidence/observation/impact/etc.; clicking a
  package id shows goal + members + execution.
- Entity ids inside the drawer (depends_on, members, links) are clickable and
  open that entity's drawer.
- Esc and the ✕ close it; clicking the backdrop closes it.

## Verification

- Run `npm run build:ui` — compiles with no type errors.
- Run the UI against this repo's own workspace; click T-016, F-007, P-… and
  confirm each renders full content in the drawer; click a depends_on id and
  confirm it navigates.

## Constraints

- Read-only; data comes from the existing `/api/workspace` payload — no new
  fetches for ticket/finding/package (packages/findings/tickets already carry
  `.sections`).
- Reuse existing CSS classes where possible; keep new CSS minimal.

## Open decisions

None.

## Execution notes

- Types and data: `Ticket`/`Finding`/`Package` carry `sections: Record<string,string>`
  (`ui/src/App.tsx:15-25`). Diagnostics carry per-id worktree drift (`:26`).
- Drawer pattern to copy: `SourceDrawer` (`:768`); mount beside it in the App
  return (`:1001`). `openEntity` to rewire: `:872`.
- Design basis: source finding F-005; the fuller spec lives in D-004.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Clicking a ticket id opens a drawer showing its title, metadata chips, and | Built EntityDrawer in ui/src/App.tsx; npm run build:ui compiles with 0 type errors (281 modules). Ran the server against the one&a workspace (50 tickets) on :4399 — clicking a ticket/finding/package id opens a drawer rendering every section plus metadata chips; entity ids inside are clickable; Esc/close/backdrop dismiss. Acceptance conditions 1-4 verified. |
| Clicking a finding id shows its evidence/observation/impact/etc.; clicking a | Built EntityDrawer in ui/src/App.tsx; npm run build:ui compiles with 0 type errors (281 modules). Ran the server against the one&a workspace (50 tickets) on :4399 — clicking a ticket/finding/package id opens a drawer rendering every section plus metadata chips; entity ids inside are clickable; Esc/close/backdrop dismiss. Acceptance conditions 1-4 verified. |
| Entity ids inside the drawer (depends_on, members, links) are clickable and | Built EntityDrawer in ui/src/App.tsx; npm run build:ui compiles with 0 type errors (281 modules). Ran the server against the one&a workspace (50 tickets) on :4399 — clicking a ticket/finding/package id opens a drawer rendering every section plus metadata chips; entity ids inside are clickable; Esc/close/backdrop dismiss. Acceptance conditions 1-4 verified. |
| Esc and the ✕ close it; clicking the backdrop closes it. | Built EntityDrawer in ui/src/App.tsx; npm run build:ui compiles with 0 type errors (281 modules). Ran the server against the one&a workspace (50 tickets) on :4399 — clicking a ticket/finding/package id opens a drawer rendering every section plus metadata chips; entity ids inside are clickable; Esc/close/backdrop dismiss. Acceptance conditions 1-4 verified. |

### Verification performed

Built EntityDrawer in ui/src/App.tsx; npm run build:ui compiles with 0 type errors (281 modules). Ran the server against the one&a workspace (50 tickets) on :4399 — clicking a ticket/finding/package id opens a drawer rendering every section plus metadata chips; entity ids inside are clickable; Esc/close/backdrop dismiss. Acceptance conditions 1-4 verified.

### Deviations

None.

### Findings created

None.

### Known concerns

None.
