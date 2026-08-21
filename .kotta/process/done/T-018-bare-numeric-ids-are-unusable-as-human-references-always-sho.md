---
id: T-018
title: >-
  Bare numeric IDs are unusable as human references — always show the title
  alongside the id
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
branch: feat/T-018-bare-numeric-ids-are-unusable-as-human-references-always-sho
pull_request: null
created_at: '2026-07-28'
updated_at: '2026-07-28'
source_observation: F-012
assigned_agent: claude
resolution: completed
---
# T-018 — Bare numeric IDs are unusable as human references — always show the title alongside the id

## Outcome

Every clickable entity id in the UI reveals its title on hover (native `title`
tooltip: `T-042 — Klikk-kimaradás…`). The operator can tell what a bare id refers
to without a lookup — no added visual clutter (F-010-friendly).

## Scope

- A module-level `id → title` registry in `ui/src/App.tsx`, populated from the
  loaded workspace (tickets, findings, packages), and an `entityLabel(id)` helper
  returning `"<id> — <title>"` (falls back to `<id>` when unknown).
- Apply the tooltip at the three places a bare id renders:
  1. markdown entity-links (the `inline-entity` button, `App.tsx:74`);
  2. the `Eid` badge component (`App.tsx:150`);
  3. the T-017 drawer's `InlineIds` chips (depends_on / package / members).

## Non-goals

- The full ULID identity rename (D-003) — this is the cheap near-term half:
  title alongside the id, no id scheme change.
- Changing how ids are stored or referenced in files; UI-only.
- Redesigning row layouts (rows already show the title beside the id).

## Acceptance

- Hovering any entity id — in rendered markdown, in an `Eid` badge, or in a drawer
  metadata chip (e.g. a `depends_on` value) — shows a native tooltip `"<id> — <title>"`.
- Unknown / unresolved ids show just the id (no broken `— undefined`).
- No new always-visible text is added to rows or chips (clutter unchanged).

## Verification

- `npm run build:ui` compiles with 0 type errors.
- Run the UI against this workspace; hover `T-016` / `F-007` / a `depends_on`
  chip and confirm the title appears in the tooltip.

## Constraints

- UI-only; data from the existing `/api/workspace` payload.
- Keep it minimal — a single shared registry + helper, no prop-threading churn
  across the ~10 `Eid`/`MarkdownContent` call sites.

## Open decisions

None.

## Execution notes

- Render points: `inline-entity` button `ui/src/App.tsx:74`; `Eid` `:150`;
  `InlineIds` (added by T-017). Entity id pattern: `ENTITY_PATTERN` `:38`.
- Design basis: source finding F-012; the near-term half of decision D-003
  (identity = ULID, human reference = title). Clusters with F-009/F-010/F-011.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Hovering any entity id — in rendered markdown, in an `Eid` badge, or in a drawer | npm run build:ui compiles clean (hash DT2ImTtR). id→title registry from /api/workspace + native title tooltip ('id — title') on markdown entity links, the Eid badge, and drawer InlineIds chips; unknown ids fall back to plain id; no always-visible text added (F-010-safe). |
| Unknown / unresolved ids show just the id (no broken `— undefined`). | npm run build:ui compiles clean (hash DT2ImTtR). id→title registry from /api/workspace + native title tooltip ('id — title') on markdown entity links, the Eid badge, and drawer InlineIds chips; unknown ids fall back to plain id; no always-visible text added (F-010-safe). |
| No new always-visible text is added to rows or chips (clutter unchanged). | npm run build:ui compiles clean (hash DT2ImTtR). id→title registry from /api/workspace + native title tooltip ('id — title') on markdown entity links, the Eid badge, and drawer InlineIds chips; unknown ids fall back to plain id; no always-visible text added (F-010-safe). |

### Verification performed

npm run build:ui compiles clean (hash DT2ImTtR). id→title registry from /api/workspace + native title tooltip ('id — title') on markdown entity links, the Eid badge, and drawer InlineIds chips; unknown ids fall back to plain id; no always-visible text added (F-010-safe).

### Deviations

None.

### Findings created

None.

### Known concerns

None.
