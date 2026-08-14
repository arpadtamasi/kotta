---
id: T-01m00afb9wt2vrbs3qgrgv0mtw
title: Contract gate treats standalone generated documents as Kotta product work
status: review
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
pull_request: local branch at 52bd2fd
created_at: '2026-08-14'
updated_at: '2026-08-14'
source_observation: F-01m007x3gsqznhbcnytnjqpfy5
assigned_agent: codex
worktree: .worktrees/T-01m00afb9wt2vrbs3qgrgv0mtw
execution_mode: inherited
branch_origin: created
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
| The shipped rule no longer classifies a standalone user-requested document as contract work solely | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| The rule explicitly permits one-off generated task outputs when they change no product or | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| Non-product process documentation and tool/agent context remain exempt. | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| Product behavior, source code, public product documentation, shipped configuration, | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| Ambiguous ownership triggers one focused question rather than an automatic contract or exemption. | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| `.kotta/` remains CLI/MCP-owned and every existing human lifecycle gate remains unchanged. | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| Focused tests prove the reported document-generation scenario and retained protections. | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| `kotta validate`, `npm run typecheck`, `npm run build`, and the full test suite pass. | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| bug: expected_behavior_verified | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| bug: regression_test_added_or_exception_recorded | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |
| bug: affected_environment_rechecked | Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually. |

### Verification performed

Acceptance mapping. Commit 52bd2fd on the recorded fix branch. (1-2) templates/AGENTS.md:103-110 scopes the gate to artifacts governed by the workspace and explicitly exempts filled documents, generated PDFs, reports, other one-off files, and standalone output that is user-visible or intended for delivery. The focused regression first failed on the old template at the standalone-output assertion, then passed 22/22 after the wording change. (3) Lines 104-106 retain process-only documentation, non-product tool or agent context, and non-product housekeeping as exempt; the focused test asserts all three. (4) Lines 111-113 retain product behaviour, source code, public product documentation, shipped artifacts/configuration, build/release behaviour, production operations, governed deliverables, and the active contract/claim gate; the focused test asserts each protection. (5) Lines 113-115 require one focused ownership question and prohibit an automatic contract or exemption. (6) Line 116-117 retains the .kotta hand-edit ban; no lifecycle implementation changed and the diff is limited to the template, generated rules plus hash, regression test, and changelog. (7) tests/integration/sync.test.ts:157-186 proves the reported standalone-document case and every retained protection; a fresh initialized repository rendered the new rule and validated with ok:true. (8) npm run typecheck passed; npm run build passed; the full Vitest suite passed outside the loopback-restricted sandbox with 46/46 files, 318 passed and 1 skipped; focused sync suite passed 22/22. Bug profile: expected behaviour is verified by rendered output and focused assertions; the regression test was demonstrated red before the fix and green after it; Kotta 0.5.0 fresh-repository output was rechecked manually.

### Deviations

The maintainer workspace-wide kotta validate does not pass because completed historical contract T-01kzgn32keps18769dp5rstcgt declares no deviations while its verification narrative names DEVIATIONS. The same DEVIATION_MISMATCH was present before this contract was signed and is unchanged. Fixing that historical record is outside this contract; a fresh initialized Kotta workspace validates with ok:true.

### Observations created

None.

### Known concerns

The pre-existing maintainer-workspace DEVIATION_MISMATCH remains until its historical review record is corrected. The implementation, fresh-workspace validation, typecheck, build, focused regression, and full 46-file suite are green.
