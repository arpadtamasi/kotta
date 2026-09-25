---
id: T-01kz9de36qw55z9g73ynebm578
title: The Run visszakapja a hullám-alapú végrehajtási nézetet
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01kz9de36qw55z9g73ynebm578-the-run-visszakapja-a-hullam-alapu-vegrehajtasi-nezetet
pull_request: 'https://github.com/arpadtamasi/kotta/pull/25'
created_at: '2026-08-05'
updated_at: '2026-08-07'
assigned_agent: codex
worktree: .worktrees/T-01kz9de36qw55z9g73ynebm578
execution_mode: fresh
resolution: completed
---
# T-01kz9de36qw55z9g73ynebm578 — The Run restores the wave-based execution map

## Outcome

`The Run` once again answers, at a glance, where a batch is in its execution plan: what has
finished, what is active or in review, what is blocked, and what will become runnable next.
The view keeps the current Kotta Console v2 dark shell and truthful read-only provenance, while
restoring the old left-to-right wave graph that made dependencies and parallel work legible.

## Scope

1. Replace the active/review-only rows inside `RunOverlay` with a deterministic wave graph for
   every active batch. The graph is derived solely from batch membership, contract `depends_on`
   edges and canonical contract state.
2. Include every batch member in the graph, including `done`, `active`, `review`, `defined`,
   `blocked`, and any inconsistent backlog member. Completed and future work must remain visible
   because they explain the current run position.
3. Render waves left to right. Waves are sequential; members inside the same wave are parallel.
   Each wave header states its number and status composition, and arrows make the direction
   explicit. Ordering inside a wave is stable and follows batch membership order.
4. Each compact contract card shows ID, explicit text status, title, and the most useful secondary
   context: agent plus last activity for claimed work, or a waiting reason for work that has not
   started. State is never communicated by colour alone.
5. Preserve the current batch header, execution settings summary, progress, latest-movements feed,
   read-only framing, loose-work block, Escape handling and truthful derivation from workspace data.
6. Selecting a card preserves the visible run graph and changes the right-hand panel from latest
   movements to contract context: claim, branch, activity and dependencies, with a clear way back
   to movements and a way to open the existing full entity detail when needed.
7. Desktop keeps the horizontal execution axis and an independently scrollable graph. Below the
   existing mobile breakpoint, waves become a vertical top-to-bottom sequence; parallel members
   remain grouped under the same wave heading rather than flattening into one list.
8. Add focused component tests for wave derivation, state coverage, interaction, read-only
   behaviour and the mobile structure. Reuse the current design tokens and existing entity/state
   components where they still express the approved design.

## Non-goals

- No light-theme restoration. The approved direction uses the current dark Kotta Console v2 shell.
- No changes to contract, batch or event persistence and no new backend endpoint.
- No execution controls, approvals or other writes from `The Run`; it remains a derived read-only
  surface.
- No redesign of Home, Contracts, Batches, the rail, the entity drawer or the chat timeline.
- No general-purpose graph library and no arbitrary DAG canvas with free positioning or zoom.
- No changes to batch execution semantics; the UI visualizes canonical dependency data only.

## Acceptance

- An active batch with completed, active, review, defined and blocked members renders all of them
  exactly once in deterministic dependency waves.
- A dependency chain renders left to right on desktop, and two contracts with the same satisfied
  dependency render in the same parallel wave.
- Wave labels state both sequence and composition, such as `wave 3 · 1 review · 1 waiting`.
- The active contract is the strongest visual anchor, while done, review, defined and blocked each
  have distinct borders/fills plus an explicit readable status label.
- A selected card leaves the graph in place and shows its canonical claim, branch, activity and
  dependency context in the right panel; returning to Latest movements is one obvious action.
- The latest-movements feed still appears by default and remains derived from persisted timestamps
  or events without inventing lifecycle state.
- Active contracts outside a batch remain visible under a separate loose-work heading.
- At widths at or below 900px, the same waves read top to bottom, arrows point downward, parallel
  members remain grouped, and no page-level horizontal overflow is introduced.
- Keyboard users can reach every card and inspector action, focus is visible, status is not
  colour-only, and reduced-motion preference removes nonessential transitions.
- Merely opening, scrolling, selecting cards and closing `The Run` causes no request to a write
  endpoint and no canonical workspace change.
- The implementation visually matches the approved mockup's hierarchy and density. Reference:
  `/Users/rp/.gstack/projects/arpadtamasi-kotta/designs/run-wave-20260805/run-redesign.html`.

## Verification

- `npx vitest run tests/ui/run.test.tsx` — wave derivation, complete state rendering, selection and
  the latest-movements return path.
- `npx vitest run tests/ui/board-reads-only.test.tsx tests/ui/rail.test.tsx` — the Run remains a
  passive watch surface and its entry point still reports canonical running counts.
- `npm test` — build and full unit/integration/UI regression suite.
- `npm run typecheck`.
- Manual at 1600×900: compare hierarchy, density, five visible state treatments and horizontal
  wave navigation against the approved mockup.
- Manual at 390×844 and 900px: verify vertical wave sequence, grouped parallel members, visible
  focus, inspector access and absence of page-level horizontal overflow.

## Constraints

- `.kotta/` remains read-only to the React board; all displayed state comes from the existing
  `/api/workspace` response and derived board model.
- Use the established Archivo/monospace typography, zero-radius geometry, colour tokens and dark
  Run surface in `ui/src/styles.css`; do not introduce a second design system or hard-coded colours
  where a token exists.
- Wave computation must terminate and remain deterministic for malformed or cyclic dependency
  data. A cycle or unresolved in-batch dependency is surfaced as a visible blocked/inconsistent
  remainder, never hidden and never used to invent an execution order.
- Existing unrelated user changes, contracts and observations are out of scope.

## Open decisions

None.

## Execution notes

- The user approved the dark-shell wave direction on 2026-08-05.
- The old implementation at commit `4536763` contains a small `computeWaves` and `WaveGraph`, but it
  is reference material, not code to copy blindly: it had a 12-iteration guard and silently forced
  cyclic leftovers into arbitrary waves. The new helper must make malformed topology explicit.
- Current regression source: `RunOverlay` in `ui/src/App.tsx` filters batch members to only
  `active` and `review`, removing the history and future context that makes the run understandable.
- Keep implementation local to the Run derivation/component and its styles unless a small exported
  pure helper materially improves testing.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| An active batch with completed, active, review, defined and blocked members renders all of them | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| A dependency chain renders left to right on desktop, and two contracts with the same satisfied | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| Wave labels state both sequence and composition, such as `wave 3 · 1 review · 1 waiting`. | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| The active contract is the strongest visual anchor, while done, review, defined and blocked each | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| A selected card leaves the graph in place and shows its canonical claim, branch, activity and | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| The latest-movements feed still appears by default and remains derived from persisted timestamps | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| Active contracts outside a batch remain visible under a separate loose-work heading. | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| At widths at or below 900px, the same waves read top to bottom, arrows point downward, parallel | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| Keyboard users can reach every card and inspector action, focus is visible, status is not | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| Merely opening, scrolling, selecting cards and closing `The Run` causes no request to a write | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |
| The implementation visually matches the approved mockup's hierarchy and density. Reference: | Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea. |

### Verification performed

Acceptance 1-4: tests/ui/run.test.tsx proves deterministic dependency waves, stable parallel order, exact once-only rendering for done, active, review, defined, blocked and backlog states, explicit composition labels, and visible unresolved cyclic topology. Acceptance 5-7: component tests prove the graph remains visible during inspection, canonical claim/branch/activity/dependency context is shown, Latest movements is restorable, and loose active work remains; manual QA at 1600x900 confirmed the horizontal graph and inspector beside it. Acceptance 8: manual QA at 900x900 and 390x844 confirmed top-to-bottom waves, grouped parallel members, downward arrows, and DOM measurements of 390px body/root/Run widths confirmed no horizontal overflow. Acceptance 9-10: every card and inspector action is a button with explicit text state; passive-interaction tests observed no write fetches, and the worktree stayed clean after QA. Acceptance 11: screenshots at 1600x900, 900x900 and 390x844 visually matched the approved dark-shell mockup hierarchy and density; browser console had no errors. Verification: npm test passed 38 files, 233 tests, 1 skipped; npm run typecheck passed; production build passed; kotta validate passed. Commit 94fb0ea.

### Deviations

None.

### Observations created

None.

### Known concerns

None.
