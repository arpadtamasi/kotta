---
id: T-003
title: Implement transactional shape apply with journaled crash recovery
status: backlog
origin: human
types:
  - feature
profiles:
  - workflow
priority: medium
risk: medium
batch: P-001
depends_on:
  - T-001
  - T-002
  - T-004
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-003 — Implement transactional shape apply with journaled crash recovery

## Outcome

After previewing a valid plan, a user can approve that exact `plan_hash` and apply all ticket, package, finding-disposition, provenance, index, and event changes as one recoverable operation. Validation failures and stale plans write nothing; process crashes converge to either the original or fully valid target state.

## Actors

- Human approver supplies the previewed hash.
- Shape Apply validates, allocates IDs, stages, publishes, and reports the mapping.
- Shared mutation lock excludes every other canonical writer.
- Operator invokes `--recover` after a dead process.

## Initial state

A valid plan from T-001, matching workspace/inspected-file digests, an unlocked repository, and no unresolved recovery state. New entities have temp IDs; existing attach targets are backlog tickets.

## States

`checking → staged → prepared → live_moved → new_live → backup_removed → complete`; any pre-publish failure is `aborted`. Crash recovery infers the safe action from journal phase plus live/stage/backup validity.

## Transitions

- Lock and revalidation permit checking→staged.
- Full staged graph validation and fsync permit staged→prepared.
- Same-filesystem renames perform prepared→live_moved→new_live.
- Valid target cleanup performs new_live→backup_removed→complete.
- Defined recovery combinations roll back or finish idempotently.

## Triggers

`a-team shape apply --plan <file> --approve <plan_hash>`; `a-team shape recover` (or `apply --recover`) handles a dead owner and known journal state.

## Permissions

Apply requires an exact hash produced by preview and the shared exclusive mutation lock. It does not authenticate a human identity; hosted auth is out of scope.

## Error paths

Reject hash/base mismatch, lock contention, invalid lifecycle/graph, ID/ref collision, staging or fsync error, failed target validation, corrupt journal, missing rollback backup, or unknown directory combination. Unknown recovery state stops diagnostically without deleting artifacts.

## Cancellation path

Before live→backup, discard stage and release lock. After publish begins, cancellation executes the same rollback/recovery state machine and never abandons a half-known state silently.

## Retry and duplicate-action behaviour

Reapplying an already consumed plan is stale because finding/entity state changed. Recovery is idempotent for every documented directory combination. ID allocation occurs once under lock from the next free sequence.

## Audit and notification expectations

One shape event records plan hash, base digests, temp→canonical ID map, dispositions, actor marker, and timestamp. JSON/human output reports created/updated entities, recovery actions, and artifact paths on manual intervention.

## Scope

- Exact approval binding and base revalidation under the T-002 lock.
- Deterministic ID allocation, full sibling stage copy with modes, plan application, index regeneration, single event, and full graph validation.
- Durable journal updates, fsync, directory swaps, cleanup, rollback, and the recovery matrix from the approved design.
- New backlog tickets/packages, attach to existing backlog tickets, and all eight finding dispositions.

## Non-goals

- Automatically setting tickets ready, starting implementation, or committing to git.
- Modifying ready/active/review/done tickets or existing package membership.
- Power-loss-proof filesystem transactions, remote storage, auth, or distributed concurrency.

## Acceptance

- Apply accepts only the exact canonical preview hash and matching HEAD/workspace/inspected-file digests.
- Every temp ID is replaced consistently; no dangling reference, duplicate action, cycle, or asymmetric package membership remains.
- Pre-publish failure leaves the original workspace byte-identical.
- A competing canonical writer cannot mutate between staging and publish.
- Faults after journal creation, each rename, backup deletion, and journal deletion recover idempotently.
- Success leaves one valid live `.a-team`, no transaction artifacts, and prints the ID map.

## Verification

- End-to-end fixture previews then applies a plan exercising all eight dispositions.
- Child-process concurrency verifies the shared lock and collision-free IDs.
- Fault injection terminates the process at every durable phase; a second process recovers and compares canonical digests.
- Negative tests cover stale bases, wrong approval hash, illegal target state, invalid graph, corrupt journal, and missing backup.

## Constraints

Same-filesystem sibling directories are required for rename semantics. Preserve file modes. Do not promise power-loss atomicity; document platform assumptions.

## Open decisions

None.

## Execution notes

Implement after T-001, T-002, and T-004. Keep the transaction engine separate from plan semantics. Recovery combinations are normative: original live+stage/no backup discards stage; no live+stage+valid backup rolls back backup→live; valid target live/no stage+valid backup finalizes and removes backup; invalid target live/no stage+valid backup quarantines target then rolls back; valid target live/no stage/no backup may finish cleanup only when journal target digest and plan hash match. Any other combination or corrupt journal stops without deletion. Success cleanup order is validate target, delete backup, fsync parent, persist `backup_removed`, delete journal, fsync parent, delete lock, fsync parent.
