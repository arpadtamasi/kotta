---
id: T-002
title: Introduce a shared mutation lock for every canonical A-Team writer
status: backlog
origin: human
types:
  - refactor
profiles:
  - workflow
  - refactor
priority: medium
risk: medium
batch: P-001
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-002 — Introduce a shared mutation lock for every canonical A-Team writer

## Outcome

Every command and API route that writes canonical `.a-team` state participates in one repository-scoped exclusive-lock protocol, so concurrent writers cannot overwrite or interleave ticket, package, finding, claim, index, or future shape-Apply changes.

## Actors

- CLI/API mutator acquiring and releasing the lock.
- Concurrent mutator receiving a deterministic busy error.
- Operator invoking safe stale-lock recovery after a dead process.

## Initial state

Today each mutator writes files independently and regenerates the index without cross-command exclusion. The repository may have no lock, a live lock, or a stale lock left by a dead process.

## States

- `unlocked`; `held` by a live PID/operation; `stale` with dead PID; `recovering` under explicit operator action.

## Transitions

- Atomic `wx` creation moves unlocked→held.
- Successful or failed mutation releases held→unlocked in `finally`.
- Process death yields held→stale.
- `--recover` may remove stale→unlocked only after ownership and recovery-state checks.

## Triggers

Every canonical writer acquires the lock before its first read-for-write or ID allocation. Read-only status, validate, preview, and UI workspace reads do not acquire it.

## Permissions

Normal commands may acquire an absent lock. Only explicit recovery may remove a stale lock; a live PID's lock is never stolen.

## Error paths

Lock contention returns owner PID, operation, start time, and retry guidance without writing. Malformed lock, uncertain PID liveness, permission failure, or an outstanding shape journal refuses automatic cleanup.

## Cancellation path

Signals and thrown errors release the owned lock in `finally` when safe. Process death is handled as stale state on the next mutation.

## Retry and duplicate-action behaviour

Retry after the owner exits is safe. Lock acquisition is non-blocking in V1; there is no hidden wait queue. A process can re-enter only through an explicit operation context, preventing self-deadlock in helpers such as package membership/index regeneration.

## Audit and notification expectations

Lock metadata contains version, PID, operation, started_at, and optional plan hash. Contention and recovery are surfaced in human and JSON command output.

## Current structural problem

Ticket, package, finding, claim, lifecycle, and UI API paths call filesystem helpers directly. A future directory-swap Apply could erase a mutation that occurs after its staging copy, and two current `nextId` calls can race.

## Demonstrated cost or risk

Lost canonical PM state is silent and difficult to reconstruct. The transactional Apply contract is false unless all writers share the same exclusion boundary.

## Behavioural invariants

- Existing successful commands produce the same canonical entity changes and index contents.
- Read-only commands remain concurrent and side-effect free.
- At most one canonical writer holds the repository lock.
- Helpers invoked inside one operation reuse the operation context rather than reacquiring.

## Target structural property

One lock service wraps every public canonical mutation at the repository root; filesystem services require a mutation context for writes. The protocol is reusable by T-003.

## Excluded redesign

No daemon, database transaction manager, distributed lock, hosted coordination, auth, scheduler, or lifecycle redesign.

## Behaviour-preserving verification

Run every existing mutation test before/after, add two-process contention tests for ID creation and package updates, inject failures to verify release, and assert read-only commands still work while a writer holds the lock.

## Scope

- Shared lock service and mutation context.
- Adoption by init, ticket/finding/package/claim mutations, lifecycle transitions, and UI mutation routes.
- Live-owner diagnostics and conservative stale-lock recovery hook compatible with T-003 journals.

## Non-goals

- Shape staging/journal/swap itself; that is T-003.
- Waiting queues, fairness guarantees, or network/distributed filesystems.

## Acceptance

- Two concurrent ticket creations allocate unique IDs; one completes and the other returns a contention error or safely retries after release.
- No canonical writer can reach a write or ID-allocation path without a held mutation context.
- Error and signal paths do not leave a lock when the owning process can clean up.
- A live lock cannot be stolen; a dead lock with uncertain recovery artifacts is not deleted automatically.
- Current mutation and lifecycle test behavior remains unchanged apart from documented contention errors.

## Verification

- Static/code-path audit enumerates every exported mutator and UI mutation route and proves lock wrapping.
- Integration tests run competing child processes for ticket IDs, package membership, finding resolution, and a simulated long mutation.
- Fault-injection tests throw before/after entity write and index regeneration, then verify lock state and canonical validity.

## Constraints

Lock artifact is repo-root `.a-team.shape.lock`, outside the canonical directory swap. Keep Windows behavior explicitly tested or documented if atomic `wx`/PID liveness differs.

## Open decisions

None.

## Execution notes

T-003 depends on this contract. Prefer a narrow mutation-context API over scattered acquire/release calls.
