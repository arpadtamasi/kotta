---
id: T-01kzzs5jvsdz9ahjx77h9dd54m
title: >-
  A board fókuszálása frissességre, futási metrikákra és strukturált
  contract-részletekre
status: active
origin: human
types:
  - feature
profiles:
  - ui
  - metric
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01kzzs5jvsdz9ahjx77h9dd54m-a-board-fokuszalasa-frissessegre-futasi-metrikakra-es-strukt
pull_request: null
created_at: '2026-08-14'
updated_at: '2026-08-14'
assigned_agent: codex
worktree: .worktrees/T-01kzzs5jvsdz9ahjx77h9dd54m
execution_mode: inherited
branch_origin: created
---
## Outcome

The board answers three operator questions within seconds: how old each relevant item is, how long an execution has been or was running and what it cost in tokens, and what a contract is trying to achieve. Contract details open on a concise structured brief; conversation and lifecycle activity are secondary. UI that does not help one of these questions is removed.

## User goal

Scan the workspace for forgotten or expensive work, understand a contract without reading its chat history, and know whether a running execution is making reasonable progress.

## Entry point

`kotta ui` opens Home. Entity rows open the existing detail drawer. The rail continues to reach the corpus and Run view; the board remains read-only.

## Default state

Lists expose human-readable age at scan level. A running contract exposes live elapsed time derived from its claim. A contract drawer opens on a **Brief** tab containing goal, success conditions, scope, constraints and verification. **Context** contains provenance, dependencies and specialist sections. **Activity** contains lifecycle events and chat and is last.

## Loading state

Keep the existing stable shell and quiet row placeholders. Unknown metric values are not guessed while the workspace request is in flight.

## Empty state

Empty queues state the useful absence in one short sentence. Contract sections with no content are omitted. A run with no recorded usage says `Not recorded`, not zero.

## Error state

Workspace read errors retain retry guidance. An invalid timestamp or malformed usage record renders `Unavailable` for that metric without blanking the entity or view. Dangling provenance stays visible.

## Success state

The operator can identify age, run status/cost and the contract brief without opening raw files or reading the activity stream.

## Disabled state

The board performs no mutations. Tabs and entity navigation remain available; unavailable metrics are labelled as unavailable rather than represented as disabled controls.

## Responsive behaviour

At desktop widths the concise contract summary and supporting metadata use the available drawer width. At narrow widths tabs remain horizontally usable without page overflow, metric groups stack, and long identifiers or commands wrap inside their own region.

## Keyboard and focus behaviour

Drawer focus restoration and Escape-to-close remain intact. Tabs use tab semantics, arrow-key navigation and a visible focus ring. Reading order follows Brief, Context, Activity.

## Accessibility expectations

Age and run state are conveyed in text, not colour alone. Live elapsed time does not announce every tick to assistive technology. Tabs have correct roles and relationships. The supported views have no serious or critical axe violations.

## Visual reference

The existing Kotta Console v2 Modernist system is the visual source of truth. This contract changes information hierarchy and density, not the established brand. `.impeccable/design.json`, `DESIGN.md` and `PRODUCT.md` on `chore/impeccable-ui-context` document the critique context; the implementation follows the approved distillation even when those files are not part of the product branch.

## Decision supported by the metric

Decide what needs attention now, whether an active execution is plausibly progressing, and whether a completed execution used a reasonable amount of time and model capacity.

## Exact semantic definition

- **Created age:** current time minus an entity's canonical `created_at`.
- **Updated age:** current time minus canonical `updated_at`, shown where recency of change matters.
- **Running elapsed:** current time minus the active claim's `started_at`; never inferred from contract `updated_at`.
- **Completed duration:** execution `completed_at` minus execution `started_at`, stored in milliseconds and rendered in a compact human unit.
- **Token usage:** normalized model-reported input and output tokens for the execution. Total is their sum or the adapter's authoritative total. Estimated brief tokens are not labelled as execution usage.

## Numerator and denominator

These are absolute measures, not rates. Age and duration have elapsed milliseconds as the value and one entity or execution as the unit. Token usage has model-reported tokens as the value and one execution as the unit.

## Unit of analysis

One workspace entity for age; one execution attempt for elapsed time, duration and token usage.

## Time window

Age and active elapsed time are computed at render time. Completed metrics cover exactly one recorded execution attempt from launch to process completion.

## Segmentation

Age is segmented by entity type and lifecycle state. Execution metrics are segmented by contract, attempt and agent adapter. Input, output and total tokens remain separately inspectable when available.

## Source events or tables

Entity frontmatter provides `created_at` and `updated_at`. `.kotta/claims/<contract>.yaml` provides active `started_at`. Execution lifecycle events receive normalized `started_at`, `completed_at`, `duration_ms` and optional token usage captured from the configured agent's structured output.

## Exclusions

Queue wait time before a claim, human review time, and time between separate execution attempts are excluded from execution duration. Cached-token or reasoning-token subcategories are included only when the adapter reports them and are not fabricated. Historic runs without canonical measurements remain `Not recorded`.

## Validation cases

- A claim started 90 minutes ago renders an approximately 1h 30m live elapsed value even if the contract was updated later.
- A completed execution with known timestamps renders their exact duration.
- Structured input and output usage render individually and as a correct total.
- Historic or unsupported-adapter usage renders `Not recorded`, never `0`.
- Invalid future or malformed timestamps render `Unavailable` and do not produce negative ages.

## Actors

- Operator: reads and prioritizes work.
- Kotta CLI: creates claims and lifecycle records.
- Agent adapter: launches the executor and, when supported, emits structured usage.
- UI server: projects canonical workspace, claim and execution data into one read response.
- Board: renders the read-only projection.

## Initial state

An initialized workspace may contain new through done entities, zero or more execution events, and at most one valid claim per active contract. Historic events may not have timing or usage fields.

## States

Execution metrics distinguish `not started`, `running`, `completed with metrics`, `completed with partial metrics`, and `completed without recorded metrics`. Contract details distinguish the Brief, Context and Activity tabs.

## Transitions

Starting a contract writes a claim timestamp and moves it to active. Launching an execution fixes its start timestamp. Process completion records completion, duration and any normalized usage. Review and close retain the execution record. Changing drawer tabs changes presentation only.

## Triggers

Contract start or execute, agent-process completion, workspace refresh, passage of time for a visible running timer, opening an entity, and keyboard or pointer tab selection.

## Permissions

Only existing CLI lifecycle writers mutate claims and events. The board remains read-only and introduces no mutation endpoint or action.

## Error paths

If process output cannot be parsed for usage, execution completion is still recorded with timing and `usage: null`. If timing cannot be normalized, the UI labels it unavailable. A workspace read failure follows the existing retry path.

## Cancellation path

A cancelled execution records its end time and duration when launch occurred, while usage remains optional. Closing the drawer or switching tabs discards no state.

## Retry and duplicate-action behaviour

Each execution attempt has its own immutable metric payload. Resume or retry does not overwrite earlier attempt data. Repeated board reads only recompute display age and do not write canonical state.

## Audit and notification expectations

Execution timing and usage are stored in lifecycle event payloads with the agent identity and command already recorded. No notification is added. Unsupported or missing usage is explicit in the record and UI.

## Scope

- Project claims into `/api/workspace` so active elapsed time uses `claim.started_at`.
- Record execution start, completion, duration and normalized usage when available.
- Show scan-level age across the board's relevant entity rows and views.
- Show live elapsed time for active runs and recorded duration/token usage for completed executions.
- Rebuild the contract drawer around Brief, Context and Activity, with Brief first and Activity last.
- Remove duplicate metadata, timeline-first presentation, empty sections and explanatory copy that does not help freshness, execution monitoring or contract understanding.
- Add focused unit, integration and component coverage plus live visual checks.

## Non-goals

- Making the board writable.
- Inventing token data for historic executions or adapters that do not report it.
- Redesigning Kotta's brand, navigation model or lifecycle.
- Removing canonical contract prose from disk; distillation applies to presentation.
- Building billing or cross-contract analytics.

## Acceptance

1. Every relevant entity row exposes a truthful compact age, with created and updated age distinguished where both are decision-relevant.
2. Active runs derive a live elapsed value from the claim's `started_at`, not the contract's update time.
3. New completed and cancelled execution attempts record start, completion and duration; supported structured agent output also records normalized input, output and total tokens.
4. Completed-run UI shows duration and token usage when recorded, and `Not recorded` for historic or unsupported data without implying zero.
5. Contract details open on Brief and make goal, acceptance, scope, constraints and verification findable within seconds; Activity/chat is the last tab.
6. Context preserves dependencies, provenance and relevant specialist sections while empty and duplicate sections are absent.
7. The board remains read-only, responsive, keyboard-operable and free of serious or critical axe violations at supported widths.
8. Existing workspace batch-read performance holds: the board still loads through one `/api/workspace` request without per-entity git subprocesses.
9. Full tests, typecheck and builds pass.

## Verification

- Unit tests for timestamp normalization, duration and optional usage normalization.
- Execute-command integration tests for success, cancellation, failure, resume and unsupported usage.
- UI server integration test proving claims and execution metrics are projected in the existing batch read.
- Component tests for compact ages, active elapsed time, completed metrics, missing metrics and the three-tab contract drawer including keyboard interaction.
- Live `kotta ui` check against this repository plus a synthetic active/legacy workspace; screenshots at desktop and narrow supported widths; axe scan.
- Run `npm test`, `npm run typecheck`, `npm run build` and `kotta validate`.

## Constraints

Repository files and lifecycle events remain canonical. The board must not infer active start from `updated_at` or mislabel `briefTokens` as total usage. New event fields must be backward-compatible. Existing Modernist tokens remain the styling source. Preserve unrelated working-tree changes and the board's read-only boundary.

## Open decisions

None.

## Execution notes

Start with the canonical data path: claim projection and execution event schema. Prefer adapter-specific structured-output parsing behind one normalization boundary. In the UI, centralize age and duration formatting, and keep historic missing data explicit. Distill rather than decorate: the default contract view contains only the operator's brief; provenance and activity remain reachable but secondary.
