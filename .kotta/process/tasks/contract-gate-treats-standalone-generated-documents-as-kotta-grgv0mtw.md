---
id: T-01m00afb9wt2vrbs3qgrgv0mtw
title: Contract gate treats standalone generated documents as Kotta product work
status: done
origin: observation
types:
  - bug
profiles:
  - bug
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  fix/T-01m00afb9wt2vrbs3qgrgv0mtw-contract-gate-treats-standalone-generated-documents-as-kotta
pull_request: null
created_at: '2026-08-14'
updated_at: '2026-08-22'
source_observation: F-01m007x3gsqznhbcnytnjqpfy5
assigned_agent: codex
worktree: .worktrees/T-01m00afb9wt2vrbs3qgrgv0mtw
execution_mode: inherited
branch_origin: created
resolution: cancelled
cancellation_reason: >-
  The 0.5-based feature branch no longer exists on the remote, and the shipped
  rule now decides by purpose and effect rather than path or file type, which
  covers the standalone-document exemption this task carried.
approved_by: cli
approved_at: '2026-08-22T12:03:57.612Z'
approval_basis: 'CLI --approve: task.cancel'
---
# Contract gate treats standalone generated documents as Kotta product work

## Outcome

Kotta's shipped agent rules gate changes to the repository, product, and deliverables governed by
that repository without turning every file produced during a chat into Kotta work. An agent may
create explicitly requested standalone output artifacts, such as filled customer documents, PDFs,
reports, or other one-off generated files, without opening a Kotta contract when the task changes no
governed product or repository deliverable. Non-product tool and agent context remains exempt.

## Actual behaviour

The generated rule says that user-visible or published documentation, promised deliverables, and
every acceptance-relevant deliverable require an active contract. An agent asked to create two
standalone customer documents therefore stopped before writing them and requested a separate Kotta
contract, even though the request changed no governed product or repository deliverable. The
rendered-rules integration test explicitly requires the phrases that produce this classification.

## Expected behaviour

The gate distinguishes work governed by the current Kotta repository from standalone artifacts
created as the direct output of a user's request. Repository product behavior, source code, public
product documentation, shipped configuration, build and release behavior, and production
operations remain contract work. A one-off generated document or other task output is exempt when
it does not change those governed surfaces, even when it is user-visible or intended for delivery.
Purpose and ownership decide; path, extension, and visibility alone do not.

## Reproduction steps

1. Initialize a repository with Kotta 0.5.0 and link the generated agent rules.
2. Leave the workspace without an applicable active contract.
3. Ask the agent to create two standalone customer-facing documents without changing product
   source, configuration, public repository documentation, build, release, or production state.
4. Observe that the agent stops before creating the files and asks to open and approve a Kotta
   contract because the files are user-visible promised deliverables.

## Environment

Kotta 0.5.0 in any agent host that reads the generated `.kotta/AGENTS.md`. The reported case used an
agent with document-generation and tool-context skills; the failure is in host-independent rule
text, not in the document tools.

## Frequency

Every explicitly requested standalone artifact that is user-visible or promised is exposed to the
same overbroad classification when the agent operates under the generated rule.

## Impact

Routine document and artifact generation stops for an unrelated lifecycle ceremony. Contract
inventory accumulates records for outputs the repository does not govern, while the user must
approve a second request before the agent can perform the request they already made.

## Regression-test expectation

- Render `.kotta/AGENTS.md` and assert that the rule scopes the gate to repository/product work and
  governed deliverables.
- Assert that explicitly requested standalone customer documents and other one-off generated task
  outputs are permitted when they alter no governed surface.
- Assert that non-product tool and agent context remains exempt.
- Assert that source code, public product documentation, shipped configuration, build/release
  behavior, production operations, and hand-edits under `.kotta/` remain protected.
- The standalone-document assertion must fail against the current wording and pass after the fix.

## Scope

1. Revise the contract-boundary wording in `templates/AGENTS.md` to distinguish governed
   repository/product work from standalone task output.
2. Refresh this repository's generated `.kotta/AGENTS.md` through `kotta sync`; never hand-edit it.
3. Replace the overbroad rendered-rules assertion in `tests/integration/sync.test.ts` with explicit
   coverage for standalone generated documents, retained tool/agent-context exemption, and retained
   product/repository protections.
4. Add a changelog entry describing the corrected boundary.

## Non-goals

- A filename, directory, or extension allowlist.
- Exempting changes to the repository's source code, public product documentation, shipped
  configuration, build/release behavior, production operations, or product-owned deliverables.
- Changing contract, observation, approval, claim, branch, worktree, review, or close mechanics.
- Runtime interception of file writes or automatic classification in the CLI.
- Editing downstream repositories or existing contracts created because of the old wording.

## Acceptance

- The shipped rule no longer classifies a standalone user-requested document as contract work solely
  because it is user-visible, publishable, promised, or acceptance-relevant.
- The rule explicitly permits one-off generated task outputs when they change no product or
  repository deliverable governed by the current Kotta workspace.
- Non-product process documentation and tool/agent context remain exempt.
- Product behavior, source code, public product documentation, shipped configuration,
  build/release behavior, production operations, and governed deliverables still require an active
  contract and claim.
- Ambiguous ownership triggers one focused question rather than an automatic contract or exemption.
- `.kotta/` remains CLI/MCP-owned and every existing human lifecycle gate remains unchanged.
- Focused tests prove the reported document-generation scenario and retained protections.
- `kotta validate`, `npm run typecheck`, `npm run build`, and the full test suite pass.

## Verification

- Run the focused integration test for the generated agent rules.
- Initialize a temporary Kotta repository, link its generated rules, and inspect the rendered
  boundary against both the standalone-document and repository-product scenarios.
- Run `kotta validate`, `npm run typecheck`, `npm run build`, and `npm test`.
- Re-read GitHub issue 37 and map its expected behavior to the final wording and regression test.

## Constraints

- The boundary is semantic and repository-ownership based, not path or extension based.
- A human's explicit request authorizes only the bounded standalone output or supporting-context
  work it names.
- Work that begins exempt but reveals a governed repository/product impact stops before that impact
  and enters the normal contract lifecycle.
- The generated rules remain concise, deterministic, host-independent, and offline.
- Generated `.kotta/AGENTS.md` is refreshed only through Kotta's validated sync path.

## Open decisions

None.

## Execution notes

Source observation: GitHub issue 37. Root cause confirmed in `templates/AGENTS.md` and
`tests/integration/sync.test.ts`: the rule and its regression test intentionally use deliverable
visibility as a gate, which necessarily captures the reported standalone customer documents.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The shipped rule no longer classifies a standalone user-requested document as contract work solely | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| The rule explicitly permits one-off generated task outputs when they change no product or | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| Non-product process documentation and tool/agent context remain exempt. | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| Product behavior, source code, public product documentation, shipped configuration, | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| Ambiguous ownership triggers one focused question rather than an automatic contract or exemption. | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| `.kotta/` remains CLI/MCP-owned and every existing human lifecycle gate remains unchanged. | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| Focused tests prove the reported document-generation scenario and retained protections. | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| `kotta validate`, `npm run typecheck`, `npm run build`, and the full test suite pass. | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| bug: expected_behavior_verified | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| bug: regression_test_added_or_exception_recorded | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |
| bug: affected_environment_rechecked | Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate. |

### Verification performed

Corrected the generated contract-boundary rule so repository/product work and governed deliverables remain gated while explicitly requested standalone output artifacts are exempt when they change no governed surface; refreshed .kotta/AGENTS.md through kotta sync, added focused rendered-rules coverage and changelog documentation in commit 52bd2fd. GitHub issue #37 was re-read and its expected behavior matches the final wording. Verification: npm exec vitest -- run tests/integration/sync.test.ts (22 passed); npm run typecheck; npm run build; npm test (318 passed, 1 skipped); kotta validate.

### Deviations

None.

### Observations created

F-01m0g45rarfc7xdwydn5nn9try — contract review could not locate a valid worktree left under a previous control checkout; recovered with git worktree move.

### Known concerns

The feature branch is based on the 0.5.0 line and will need reconciliation with the current 0.7 main before merge. Restoring its stale node_modules reported two high-severity dependency advisories; dependency remediation was not part of this contract.
