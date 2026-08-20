---
id: T-01m0fq306xed253zf243bwk94f
title: 'An observation can amend the spec: the amend-spec disposition'
status: active
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on: []
blocks: []
spec:
  - SM-01m0f0wn892ntx934by9gwednb
  - GT-01m0f0wn89ep8038fwn1nf1kkc
  - BR-01m0f0wn898xd4tr7j7t9bsjy7
  - UC-01m0f0wn89fpwvdh3gz31cdtn9
branch: >-
  feat/T-01m0fq306xed253zf243bwk94f-an-observation-can-amend-the-spec-the-amend-spec-disposition
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
assigned_agent: claude
worktree: .worktrees/T-01m0fq306xed253zf243bwk94f
execution_mode: fresh
branch_origin: created
start_ref: coord/P-01m0fq77101axprvcjwrq3bs61
start_commit: 167d13306d61dd7fa52bc4fb24e49abae96da9d2
dependency_integration_target: coord/P-01m0fq77101axprvcjwrq3bs61
---
## Outcome

An observation has a constructive exit into the specification. `observation resolve` accepts the disposition `amend-spec`; the resolved record names the spec nodes the amendment touched, and the human line - not a task - is what changes the agreement. Measured on this workspace, 43 of 45 resolutions exited into a contract because nothing else was selectable (F-01m0f4fd8r3eapgd38f5c4wer9); after this task the primary constructive exit exists.

## Scope

The disposition enum in the observation schema, resolve command and MCP tool, the resolution record (a `spec` field naming amended nodes), and the shipped skills' disposition lists (validate-observation). Board rendering of the new disposition value.

## Non-goals

No spec-writing service: the amendment itself is shaped by hand as project-owned files and lands with the human yes, as the spec states. No automatic task generation from the landed delta. No retro-migration of already-resolved observations.

## Acceptance

- `kotta observation resolve <id> --disposition amend-spec --approve` succeeds and records the disposition with its justification and the named spec nodes.
- The published observation schema and the CLI enum agree, amend-spec included (the attach-existing vs attach-to-existing-contract drift of F-dm37tkv3 does not recur).
- The validate-observation skill and the board present amend-spec as a first-class disposition.

## Verification

- Unit and integration tests over resolve with amend-spec, including refusal without approval.
- A schema-to-enum agreement test that fails on drift.

## Constraints

Existing resolved observations are untouched; identifiers are permanent.

## Open decisions

None.

## Execution notes

The spec side already states the model: observation lifecycle SM, Disposition glossary, "An observation is not a task".
