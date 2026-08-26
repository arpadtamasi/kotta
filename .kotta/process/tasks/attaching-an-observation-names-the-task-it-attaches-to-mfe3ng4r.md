---
id: T-01m0yh0wjar1yaj6n9mfe3ng4r
title: Attaching an observation names the task it attaches to
status: active
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - SM-01m0f0wn892ntx934by9gwednb
  - E-01m0f0wn89cry06jvtwtmpk4fr
  - IF-01m0f0wn8994dzf9z1sdygxa04
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-26'
updated_at: '2026-08-26'
coverage:
  'Attaching names its task. `observation resolve --disposition attach-to-existing-task` takes the task it attaches to, and the resolved observation records it — the same way amend-spec records the nodes it amended.':
    - SM-01m0f0wn892ntx934by9gwednb
    - E-01m0f0wn89cry06jvtwtmpk4fr
  'A disposition whose meaning is a reference is refused without one. Attaching with no task, or with a task that does not resolve, is refused by name and changes nothing — and no other disposition accepts a task.':
    - SM-01m0f0wn892ntx934by9gwednb
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'The chat surface carries the same requirement. `approval_request` with `observation.resolve` accepts the task for this disposition and refuses without it, on the same service the CLI reaches.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'The 61 links already lost stay lost, visibly. Resolutions recorded before this carry no task and are not back-filled by guessing; the report of an observation says which task it attached to, or that none was recorded.':
    - E-01m0f0wn89cry06jvtwtmpk4fr
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: d88e09f349cddc72bd0959f449120cadb9a33dc9
---
## Outcome

`attach-to-existing-task` starts recording the one thing it means. The disposition says a noticing was folded into work that already exists, and the accepted state machine now refuses it unless the resolution names that work — but the tool has no way to say which: `observation resolve` takes `--disposition`, `--spec` and `--approve`, and only the `create-task` branch ever writes a link. Measured on this workspace, 61 observations carry the disposition and none carries a task.

The cost is not bookkeeping. It is that the honest exit is unreachable, so the reachable one gets used instead: resolving F-01m0tnv8vmjjjack09xt7w25zf reached for `create-task`, which minted an empty duplicate that was cancelled the same day. A vocabulary that offers an exit it cannot complete pushes work toward the exit it can.

## Scope

- `observation resolve` gains the task the attach disposition needs, validated to a task that resolves, and stored on the resolved observation.
- Refusals: attaching without it, attaching to an id that resolves to nothing, and naming it on a disposition that has no use for one.
- The MCP path: `approval_request` with `observation.resolve` carries the same field under the same rules.
- `observation show` reports the attached task, or its absence, for a resolved observation.

## Non-goals

- Back-filling the 61. Which task each was folded into is not recorded anywhere; inferring it would manufacture a link the record never had.
- Changing what the disposition means, or any other disposition's payload.
- The `related_task` and `duplicate_of` attributes, which answer different questions and are untouched.

## Acceptance

- Attaching names its task. `observation resolve --disposition attach-to-existing-task` takes the task it attaches to, and the resolved observation records it — the same way amend-spec records the nodes it amended.
- A disposition whose meaning is a reference is refused without one. Attaching with no task, or with a task that does not resolve, is refused by name and changes nothing — and no other disposition accepts a task.
- The chat surface carries the same requirement. `approval_request` with `observation.resolve` accepts the task for this disposition and refuses without it, on the same service the CLI reaches.
- The 61 links already lost stay lost, visibly. Resolutions recorded before this carry no task and are not back-filled by guessing; the report of an observation says which task it attached to, or that none was recorded.

## Verification

- `run: npx vitest run tests/integration/observation.test.ts` — the CLI path, its refusals, and what the resolved record holds.
- `run: npx vitest run tests/integration/mcp.test.ts -t 'observation'` — the same requirement on the chat surface.
- `run: npx vitest run tests/integration/surface-snapshot.test.ts tests/integration/operation-registry.test.ts` — the option reaches the declared surface.

## Constraints

The payload rule applies (BR-01m0vqr9k6r571egp3z8qwnpkj): each approval action accepts exactly the fields it needs, so the task is accepted for this disposition and refused for the others, checked before the human is asked.

An observation resolved before this change carries no task and must keep validating; the requirement binds new resolutions, not the record's history.

## Open decisions

None.

## Execution notes

`resolveObservation` in `src/commands/observation.ts` holds the disposition dispatch — the `create-task` branch is the only one that writes `entity.data.task` today, around line 127. `findTask` is the resolver to validate against, already imported there.

`validatePayload` in `src/commands/approval.ts` scopes `observation.resolve` to `disposition` and `spec`; the task joins it under the same per-disposition rule that keeps `spec` to amend-spec.

The CLI option sits beside `--spec` in `src/cli/index.ts`; the surface snapshot will move by exactly that line.
