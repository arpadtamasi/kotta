---
id: T-01kzwxfdabqvrtct2vzfzqzpfd
title: >-
  The unconditional agent rule turns process documentation and non-product
  housekeeping into contract work
status: review
origin: observation
types:
  - bug
  - workflow
profiles:
  - bug
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  fix/T-01kzwxfdabqvrtct2vzfzqzpfd-the-unconditional-agent-rule-turns-process-documentation-and
pull_request: null
created_at: '2026-08-13'
updated_at: '2026-08-13'
source_observation: F-01kzwwsjvcbcxf5vpee4g2s4mc
assigned_agent: codex
worktree: .worktrees/T-01kzwxfdabqvrtct2vzfzqzpfd
execution_mode: fresh
branch_origin: created
start_ref: HEAD
start_commit: a0c8bf34fab7b7330617070b7f0753022b12393e
---
# The contract gate excludes process-only documentation and non-product housekeeping

## Outcome

Kotta's shipped agent rules define contract-worthy work by its effect, rather than treating every
repository file write as product work. An agent may create or update process-only documentation,
tool or agent context, and similar housekeeping without an active contract when the requested
change does not alter product behaviour, a user-visible or published deliverable, build and release
behaviour, or production operations. Product work continues to require an active contract and its
claim.

In the reported scenario, an explicitly requested `impeccable init` may capture context in
`PRODUCT.md` while there are zero active contracts; it must not invent a documentation contract or
stop solely because that context file is missing.

## Actors

- **Human.** Requests either product work or supporting, non-product repository work and resolves
  ambiguity about whether an artifact is itself a deliverable.
- **Calling agent.** Classifies the requested outcome using the shipped boundary, performs an
  exempt supporting change only when the human requested it, and enters the contract lifecycle for
  product work.
- **Kotta.** Ships the boundary in its generated agent rules and keeps lifecycle-state mutations
  behind the existing CLI/MCP and human gates.

## Initial state

A Kotta-enabled repository may have no active contract, or only defined contracts unrelated to the
request. The human asks for a repository write such as process documentation, tool context, source
code, public documentation, or release configuration.

## States

- **Unclassified request.** The requested effect has not yet been compared with the contract
  boundary.
- **Exempt supporting work.** The change is process-only documentation, tool/agent context, or
  housekeeping and changes no product or promised deliverable.
- **Contract work.** The change affects product behaviour, user-visible or published content, a
  shipped artifact, build/release behaviour, production operations, or another acceptance-relevant
  deliverable.
- **Ambiguous.** Available context does not establish which of the two categories applies.

## Transitions

- Unclassified request -> exempt supporting work when its observable effect is confined to internal
  process or tool/agent support.
- Unclassified request -> contract work when it changes a product or deliverable named above.
- Unclassified request -> ambiguous when the effect cannot be established from the request and
  repository; the agent asks one focused question about the artifact's role.
- Exempt supporting work -> contract work if execution reveals product or deliverable impact; the
  agent stops before that impact and enters the normal lifecycle.

## Triggers

The boundary is evaluated whenever an agent operating under `.kotta/AGENTS.md` is asked to create,
edit, move, or delete a repository file and no applicable active contract and claim already govern
the work.

## Permissions

- The human's explicit request authorizes only the bounded exempt supporting change it names.
- Product and deliverable work still needs an active contract held by the acting agent.
- Files under `.kotta/` remain canonical lifecycle state and are changed only through Kotta's
  validated CLI or MCP services; this exemption never permits hand-editing them.
- Sign, resolve, close, cancel, and other existing human gates are unchanged.

## Error paths

- If an agent cannot tell whether documentation is internal process context or a published/product
  deliverable, it asks the human instead of automatically creating a contract or silently assuming
  an exemption.
- If an exempt task expands into source, public content, build/release, operational, or other
  deliverable changes, the agent stops before those edits and uses the contract workflow.
- If project-specific `AGENTS.md` rules are stricter, they continue to apply; Kotta does not erase a
  project's own policy.

## Cancellation path

Exempt supporting work creates no Kotta lifecycle entity and can simply stop with any partial file
changes reported to the human. Contract work keeps the existing cancel path; this contract changes
none of its states or approvals.

## Retry and duplicate-action behaviour

Repeating an idempotent support initializer remains the tool's responsibility and does not create a
contract merely because it runs twice. Reclassifying the same request does not create lifecycle
records until the request crosses the product/deliverable boundary.

## Audit and notification expectations

Kotta creates no observation, contract, approval receipt, or lifecycle event solely for exempt
supporting work. Tracked file changes remain visible through ordinary Git history. When work is
classified as contract work, all existing Kotta audit and review requirements remain in force.

## Actual behaviour

`templates/AGENTS.md` says: **"No change without an active contract you hold the claim for."** The
sentence has no purpose or impact boundary. Agents therefore apply it to every repository write,
including process-only documentation and tool-managed context files.

## Expected behaviour

The shipped rule distinguishes product/deliverable changes from supporting repository changes.
Process-only documentation, tool or agent context, and similar non-product housekeeping do not
require contracts. Public documentation, source, shipped configuration, build/release, production
operations, and other promised deliverables remain contract work.

## Reproduction steps

1. Initialize a repository with Kotta 0.5.0 and link `.kotta/AGENTS.md` from the project's
   `AGENTS.md`.
2. Leave the workspace with zero active contracts and any number of unrelated defined contracts.
3. Ask the agent to run `impeccable init`, whose requested output is the internal context file
   `PRODUCT.md`.
4. Observe that the agent stops before the interview or file write and asks the human to create a
   documentation contract.

## Environment

Kotta 0.5.0 in any agent host that reads the generated `.kotta/AGENTS.md`. The observed case used a
repository with zero active contracts and five unrelated defined contracts; the failure is in the
host-independent rule text, not in a CLI response.

## Frequency

Every no-active-contract request that writes process documentation, tool/agent context, or similar
repository housekeeping is exposed to the same instruction and can be blocked in the same way.

## Impact

Routine supporting work is inflated into product lifecycle state. Humans must interrupt the task,
create and later retire documentation contracts, and distinguish those records from actual product
commitments. The contract inventory stops representing what changes the product, while agents still
cannot proceed with the support work the human explicitly requested.

## Regression-test expectation

- A focused test renders `.kotta/AGENTS.md` and asserts that the contract rule names the
  product/deliverable boundary and the exempt supporting categories.
- The test also asserts that source, public documentation, shipped/build/release and production
  changes remain contract-gated, and that `.kotta/` still cannot be hand-edited.
- A scenario assertion covers `PRODUCT.md` context capture with zero active contracts.
- The assertions fail against Kotta 0.5.0's unconditional wording and pass with the revised rule.

## Scope

1. Revise the contract-gate wording in `templates/AGENTS.md` so it is purpose- and impact-based,
   with explicit positive and negative examples and an ambiguity path.
2. Refresh this repository's generated `.kotta/AGENTS.md` through `kotta sync`; never hand-edit the
   generated copy.
3. Extend the rules-file integration coverage in `tests/integration/sync.test.ts` to assert the new
   boundary in the rendered file and preserve the existing lifecycle protections.
4. Keep the rule concise enough to remain useful as always-loaded agent context.

## Non-goals

- A filename or extension allowlist. `README.md`, `PRODUCT.md`, YAML, or any other path can be a
  deliverable in one repository and internal context in another; purpose and effect decide.
- Exempting public/product documentation, source changes, shipped configuration, build/release
  workflows, production operations, or any other acceptance-relevant deliverable.
- Changing contract, claim, approval, observation, review, close, cancel, branch, or worktree
  mechanics.
- Adding runtime file-write interception or asking Kotta to infer file purpose in the CLI.
- Editing downstream repositories or retroactively removing documentation contracts.
- Changing the transport of generated rules. The related defined contract “The agent rules reach
  the calling chat as a generated file, not a hand-copied one” explicitly excludes rule-content
  changes; this contract changes content only and has no execution dependency on it.

## Acceptance

- The shipped rule no longer states or implies that every repository change requires an active
  contract.
- It explicitly permits human-requested process-only documentation, tool/agent context, and similar
  housekeeping when they do not alter a product or promised deliverable.
- It explicitly keeps product behaviour, user-visible or published documentation, shipped
  artifacts/configuration, build/release behaviour, production operations, and other
  acceptance-relevant deliverables behind an active contract and claim.
- It preserves the ban on hand-editing `.kotta/` and every existing human lifecycle gate.
- It tells the agent to ask one focused classification question when an artifact's role is
  ambiguous, rather than defaulting to a new contract.
- The rendered rules make the reported zero-active-contract `PRODUCT.md` context-capture scenario
  permissible without weakening the product-work gate.
- Focused regression tests fail against the old unconditional rule and pass against the revised
  template and rendered file.
- `kotta validate`, `npm run typecheck`, `npm run build`, and the full test suite pass.

## Verification

- `npx vitest run tests/integration/sync.test.ts` verifies source-to-rendered wording, the exempt
  scenario, retained product gates, generated-file ownership, and sync idempotence.
- Initialize a temporary repository, link the generated rules, and inspect the rendered contract
  boundary with zero active contracts.
- Review the final rule against both sides of the boundary: `PRODUCT.md` context capture proceeds;
  a source change and a public documentation change still stop without a claimed contract.
- Run `kotta validate`, `npm run typecheck`, `npm run build`, and `npm test`.

## Constraints

- The boundary is semantic, not path-based.
- The exemption applies only to work explicitly requested by the human and only while its effect
  remains non-product and non-deliverable.
- Safety and lifecycle invariants under `.kotta/` do not weaken.
- The generated rules remain host-independent, deterministic, and offline.
- No wording may require an agent to create a contract when workspace policy forbids agent-created
  contracts; it must ask the human only when the requested work is genuinely contract-worthy.

## Open decisions

None.

## Execution notes

- Source observation: “The unconditional agent rule turns process documentation and non-product
  housekeeping into contract work.”
- Confirmed root cause: `templates/AGENTS.md:103-104` uses an unconditional file-change rule; the
  CLI did not reject `impeccable init`.
- The existing defined rules-transport contract excludes content changes, so this contract is
  related but independent.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The shipped rule no longer states or implies that every repository change requires an active | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| It explicitly permits human-requested process-only documentation, tool/agent context, and similar | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| It explicitly keeps product behaviour, user-visible or published documentation, shipped | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| It preserves the ban on hand-editing `.kotta/` and every existing human lifecycle gate. | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| It tells the agent to ask one focused classification question when an artifact's role is | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| The rendered rules make the reported zero-active-contract `PRODUCT.md` context-capture scenario | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| Focused regression tests fail against the old unconditional rule and pass against the revised | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| `kotta validate`, `npm run typecheck`, `npm run build`, and the full test suite pass. | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| bug: expected_behavior_verified | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| bug: regression_test_added_or_exception_recorded | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| bug: affected_environment_rechecked | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| workflow: happy_path_verified | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| workflow: failure_and_cancellation_paths_verified | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |
| workflow: authorization_and_idempotency_verified | Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid. |

### Verification performed

Acceptance mapping after human review: (1) templates/AGENTS.md now contains only a generic effect-based boundary and names no product, initializer, or product-specific context file. (2) Bounded human-requested process-only documentation, tool or agent context, and non-product housekeeping are exempt only while they change no product or promised deliverable. (3) Product behaviour, source code, published documentation, shipped artifacts or configuration, build or release behaviour, production operations, and other acceptance-relevant deliverables remain behind an active contract and claim. (4) Purpose and effect decide; ambiguous roles require one focused question, and discovered product impact stops the exempt work before the lifecycle begins. (5) The never-hand-edit-.kotta rule and all existing human lifecycle gates remain unchanged. (6) tests/integration/sync.test.ts creates a fresh workspace, proves it has zero active contracts, and verifies the generic exempt categories plus every retained product gate without product-specific exceptions. (7) The generated .kotta/AGENTS.md was refreshed only through kotta sync; a second sync reported unchanged and its manifest hash was refreshed. (8) A repository search confirms the reported product and initializer names do not occur in the shipped template, generated rules, or generic regression test. Verification on final commit cbfd462: focused sync suite 18/18 passed; npm run typecheck passed; npm run build passed; serialized full npm test passed 45/45 files with 300 passed and 1 intentionally skipped; git diff --check passed; contract branch is clean and claim-valid.

### Deviations

Per explicit human review feedback, the product-specific impeccable-init and PRODUCT.md wording and the matching product-specific test assertion were removed. This intentionally generalizes the contract's original concrete regression expectation; the zero-active-contract scenario remains covered semantically by the generic effect-based rule and test.

### Observations created

None.

### Known concerns

Workspace-wide kotta validate remains red on a pre-existing DEVIATION_MISMATCH in unrelated completed contract T-01kzgn32keps18769dp5rstcgt; the same mismatch exists at this contract start commit a0c8bf34 and this implementation did not alter it.
