---
id: T-001
title: 'Define the shaping plan schema, canonical hashes, and preview contract'
status: backlog
origin: human
types:
  - feature
profiles:
  - workflow
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
# T-001 — Define the shaping plan schema, canonical hashes, and preview contract

## Outcome

A user can turn a reviewed finding selection into a strict, deterministic shape-plan and inspect an exact human-readable preview without changing `.a-team`. The preview identifies the precise plan, workspace state, and inspected code snapshot that a later Apply would approve.

## Actors

- PM/user: chooses the finding scope, corrects grouping, and approves an exact plan hash.
- Shaping agent: reads findings and code, then emits the typed plan.
- CLI: parses, validates, hashes, and renders the preview; it does not mutate state in this ticket.

## Initial state

A valid A-Team workspace contains open findings and may contain backlog tickets. A plan exists as a local YAML file and declares at most 100 in-scope findings plus every inspected code/config file.

## States

- `unparsed`: input bytes have not passed strict YAML parsing.
- `invalid`: schema, reference, invariant, or digest validation failed.
- `previewable`: the typed plan is valid against the current workspace snapshot.
- `stale`: HEAD, canonical workspace, or an inspected file differs from the plan base.

## Transitions

- `unparsed → invalid` on duplicate keys, aliases, custom types, unknown fields, or schema failure.
- `unparsed → previewable` after strict parse, reference validation, invariant checks, and matching digests.
- `previewable → stale` whenever a bound input changes before a later preview/apply.

## Triggers

`a-team shape preview --plan <file>` performs the complete read-only transition and prints the derived preview plus `plan_hash`.

## Permissions

Any local user who can read the repository may preview. Preview has no permission to write canonical A-Team state, allocate IDs, or transition lifecycle state.

## Error paths

Reject malformed YAML, unsupported versions/actions, missing or repeated scoped findings, invalid targets, illegal target lifecycle, dependency cycles, escaping/symlinked inspected paths, stale digests, and incomplete synthesized ticket contracts. Errors name the plan location and corrective action.

## Cancellation path

Interrupting preview leaves the workspace byte-for-byte unchanged. Temporary parser output is process-local.

## Retry and duplicate-action behaviour

Preview is idempotent. Identical typed input and identical bound state produce the same canonical hash and human preview. Re-running after a stale error requires regenerating or explicitly rebasing the plan.

## Audit and notification expectations

Output includes plan hash, base HEAD, workspace digest, inspected-files digest, finding dispositions, ticket/package changes, warnings for dirty uninspected files, and a clear `NO CHANGES APPLIED` marker.

## Scope

- Versioned plan schema with explicit `scope.findings`, `base`, `tickets`, `packages`, and tagged-union dispositions.
- Eight dispositions: attach-created, split-created, attach-existing, merge-duplicate, accept-risk, reject, investigate, keep-open.
- RFC 8785 canonical plan hashing and length-framed workspace/inspected-file SHA-256 digests from the approved design.
- Strict parser, semantic validator, reference/graph invariants, human preview renderer, and CLI command.
- Validator-clean fixture generated from a temporary workspace with real digests.

## Non-goals

- Any `.a-team` mutation, ID allocation, locking, staging, journal, or recovery.
- UI changes and entity chats.
- Automatically deciding whether the model's grouping rationale is true; the CLI validates its presence and references only.

## Acceptance

- A valid fixture previews successfully and emits a stable `plan_hash` across repeated runs.
- Every scoped finding has exactly one valid tagged-union disposition; omissions, duplicates, and out-of-scope actions fail.
- `split-created` requires at least two newly declared targets; `attach-existing` accepts backlog tickets only.
- Unknown fields, YAML duplicate keys/aliases/custom types, invalid refs, cycles, and incomplete ticket/package contracts fail before output is called previewable.
- Changing HEAD, any canonical `.a-team` input, or any declared inspected file produces `stale` without writes.
- The human preview is generated solely from the typed machine plan and displays the same hash later required by Apply.

## Verification

- Unit fixtures cover all eight actions plus malformed unions and graph invariants.
- Golden tests verify RFC 8785 plan hashes and exact framed digests, including tracked/untracked and dirty inspected files.
- Integration tests run preview against a temporary workspace, mutate each bound input class, and assert stale rejection and an unchanged filesystem snapshot.

## Constraints

Preserve current schema-v1 workspace readability. Use only repo-relative regular inspected files; reject traversal and symlinks. Hash framing is part of this ticket: strings are UTF-8; lengths are unsigned 64-bit big-endian; records are `path_length || path || content_length || raw_content`, sorted by path bytes. Workspace uses `ATEAM-WORKSPACE-V1` plus a lowercase 40-character HEAD record and all canonical `.a-team` files except derived index/transaction artifacts. Inspected files use `ATEAM-INSPECTED-V1`. Plan hash is SHA-256 of the validated typed plan serialized with RFC 8785 JCS.

## Open decisions

None.

## Execution notes

Implement before T-003 and T-006. Do not add Apply side effects under the preview command. The machine plan is authoritative; prose preview is always derived from it. Reject duplicate YAML keys, aliases, implicit custom types, and unknown fields before canonicalization.
