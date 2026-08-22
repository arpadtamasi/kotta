---
id: T-01kz1g2w1fs2qx0bs72e9pkmg4
title: >-
  Ugyanannak a ticketnek egyszerre tobb igaz allapota van — nincs kimondott
  olvasasi szabaly a git-kontextusok folott
status: backlog
origin: observation
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-028
---
# T-01kz1g2w1fs2qx0bs72e9pkmg4 — Kanonikus olvasat a git-kontextusok fölött

## Outcome

Every surface answers "what state is this ticket in?" the same way, and says which Git context it is answering from. Where contexts disagree, the disagreement is shown rather than silently resolved to one of them — and the commands that mutate a ticket act on the copy the operator was shown, not on an accidental one.

## Context

Two findings, one root.

**The read side.** oneanda P-021, 2026-08-02: three surfaces reported three states for the same tickets — T-107 `review` in the UI and `ready` in the agent's prose; T-110 `active` in the UI, `ready` with no live claim in prose; T-115 `backlog` in the UI, `done` in prose after yesterday's merge. Mechanism: `start` commits on the worktree branch, `review` on the coordinator branch, `close` after the merge; the UI reads from a stable ref (T-016/T-029), the agent reads its working copy. Every surface looks at a different Git context and each holds a different moment. T-016 fixed churn and bought staleness in exchange: in-flight work is invisible from the stable ref. There is a gate for writing (claim/lock) but no rule for reading, and the viewer is not told which context it sees.

**The write side.** Discovered during T-036: `findTicket`/`findPackage` return the *earliest* state copy. While a merge-duplicated entity exists, `ready`, `start`, `close`, `brief` and `status` all operate on the stale copy — even though `validate` flags the duplicate and `dedupe` keeps the furthest-advanced one. So the two halves contradict each other on which copy is real.

## Scope

- A stated canonical read: base ref plus a claim/worktree overlay, applied by every surface that reports entity state.
- Where contexts disagree, both are surfaced with their origin (for example `review @coord/p021 · backlog @main`) as a badge on the entity, not a separate panel.
- Entity lookup resolves to the same copy the canonical read reports, so mutations and reports cannot diverge.
- The rule is written down where surfaces can follow it, not reimplemented per surface.

## Non-goals

- Removing directory-as-state storage, or changing identity minting.
- Resolving merge duplicates — that is `dedupe` (T-036); this ticket only stops readers and writers from disagreeing about which copy counts.
- A new UI panel or drift dashboard.
- Changing when `start`, `review` and `close` commit.

## Acceptance

1. A ticket whose worktree copy is ahead of the base ref is reported with both states and their origins by CLI status and the UI, from the same underlying read.
2. `findTicket` resolves to the same copy that read reports; a fixture with a merge-duplicated entity proves `ready`/`start`/`close`/`brief`/`status` no longer act on the stale copy.
3. With no disagreement, output is unchanged — no badge, no extra noise.
4. The UI does not regain per-file Git subprocesses; the T-029 read-performance contract holds.
5. Full suite, typecheck and builds green.

## Verification

Git fixtures reproducing the P-021 shape: a ticket advanced in its worktree while the base ref lags, and a merge-duplicated entity. Assert CLI and UI report identically, and that mutations target the reported copy. Re-run the T-029 subprocess-count test.

## Constraints

Git and the worktree are authoritative at read time. The canonical read must not reintroduce per-entity subprocesses. No surface may silently pick a winner where contexts disagree.

## Open decisions

None.

## Execution notes

Read path: `readWorkspace` in `src/commands/ui.ts` (stable-ref reader from T-029), `resolveEffectiveTicket` in `src/filesystem/entities.ts` (the existing worktree overlay), and `findTicket`/`findPackage` (the earliest-copy behaviour to fix). Sibling findings: the read side is the F-028 evidence, the write side was recorded during T-036 and merged here.
