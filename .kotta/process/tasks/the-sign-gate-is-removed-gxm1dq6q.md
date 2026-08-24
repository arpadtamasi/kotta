---
id: T-01m0tjx38y6mdbpyzhgxm1dq6q
title: The sign gate is removed
status: defined
origin: human
types:
  - refactor
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - SM-01m0f0wn89m2xwd4z4mk9p71d5
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  - UC-01m0f0wn89jebbfp6rjr0fxqh1
  - IF-01m0f0wn8994dzf9z1sdygxa04
branch: null
pull_request: null
created_at: '2026-08-24'
updated_at: '2026-08-24'
coverage:
  'No surface carries a sign command. `kotta task sign` and `kotta batch sign` are gone from the CLI, from the operation declaration, and from the shipped rules file; the registry''s totality test proves neither surface kept one.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  'A batch reaches defined by validating. `kotta batch validate` carries a backlog batch to defined with no approval, and refuses while any member is neither backlog, defined nor done.':
    - SM-01m0f0wn89m2xwd4z4mk9p71d5
    - UC-01m0f0wn89jebbfp6rjr0fxqh1
  'The legacy opt-in is gone from config and from every branch it fed. `workflow.require_human_sign_approval` is no longer read, no longer published in the config schema, and no longer written by init; a workspace that still carries the key is not broken by it.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'Nothing was covered only by the retired gate. Every test that reached a state through signing reaches it through defining instead, and the suite''s count does not fall.':
    - SM-01m0f0wn89gjy6dbk1j6fjpv6j
---
## Outcome

Kotta stops carrying a gate it retired. `kotta task sign` can only fire in a workspace that opts into `require_human_sign_approval` and holds a task with no spec references — a pre-coverage shape `migrate` carries everyone out of — and both this workspace and the shipped template set the flag false, so the command's one remaining act is to announce its own retirement. `kotta batch sign` has never run at all: zero events across six batches.

Worse than dead, `batch sign` contradicts what the lifecycle already says. The agreement is accepted when the spec lands, and grouping approves nothing; asking a human to sign a batch asks them to approve something that carries no agreement of its own.

## Scope

- `signTask` (36 lines) and `signBatch` (23 lines) removed, with their CLI commands and their two operation declarations.
- `requireHumanSignApproval` removed from config reading, and the four `legacyOptIn` branches it feeds in `define` and `start` removed with it.
- `batch validate` carries backlog to defined, keeping the member check the sign gate performed.
- The 13 references in the published config schema, the workspace template, the shipped `AGENTS.md` and the README go with them.
- The tests: whatever reached a state by signing reaches it by defining, and `retainLegacySignGate` goes.

## Non-goals

- Any other gate. Close, cancel, reopen and observation dispositions stay exactly as they are; this removes a gate that approves nothing, not the human gates that approve something.
- Migrating existing workspaces away from the config key. An unread key is inert, and rewriting someone's config to drop a line it no longer reads would be a worse trade than leaving it.
- Changing what `batch validate` checks. It gains a transition, not a new opinion about members.

## Constraints

If a test turns out to cover something only through the sign path, that coverage is preserved by another route rather than deleted with the gate. The suite's test count is the check: it must not fall.

The registry's totality test is the proof for the surface, not a manual reading of `--help`.

## Open decisions

None.

## Execution notes

`signTask` is at `src/commands/task.ts` around line 190; `signBatch` at `src/commands/batch.ts:219`. The `legacyOptIn` branches sit in `defineTask` (line 119), `signTask` (190, 207) and `startTask` (286).

`retainLegacySignGate` in `tests/helpers/legacy-sign.ts` is what several integration tests use to switch the gate back on; 32 test files mention signing, though most are board fixtures where `sign` is only a recorded state name.

The operation declarations are `task.sign` and `batch.sign` in `src/core/operations.ts`; removing them without removing the commands fails the registry test, and the reverse fails it too — which is the point.

## Acceptance

- No surface carries a sign command. `kotta task sign` and `kotta batch sign` are gone from the CLI, from the operation declaration, and from the shipped rules file; the registry's totality test proves neither surface kept one.
- A batch reaches defined by validating. `kotta batch validate` carries a backlog batch to defined with no approval, and refuses while any member is neither backlog, defined nor done.
- The legacy opt-in is gone from config and from every branch it fed. `workflow.require_human_sign_approval` is no longer read, no longer published in the config schema, and no longer written by init; a workspace that still carries the key is not broken by it.
- Nothing was covered only by the retired gate. Every test that reached a state through signing reaches it through defining instead, and the suite's count does not fall.

## Verification

- `run: npx vitest run tests/integration/operation-registry.test.ts` — the surface, proven as a set.
- `run: npx vitest run tests/integration/batch.test.ts` — the batch lifecycle without the gate.
- `run: npm test` — the full suite, whose count is the check that nothing was covered only by signing.
