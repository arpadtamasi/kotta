---
id: T-004
title: Add multi-finding provenance and backward-compatible entity semantics
status: backlog
origin: human
types:
  - feature
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
# T-004 — Add multi-finding provenance and backward-compatible entity semantics

## Outcome

A synthesized ticket can cite one or many findings, a split finding can cite multiple created tickets, and attaching a finding to an existing backlog ticket updates both sides without erasing the ticket's original origin. Legacy schema-v1 workspaces continue to load without bulk migration.

## Actors

- Shaping Apply writes provenance after human approval.
- Ticket Brief/chat and workspace readers consume it.
- Existing CLI/schema users open legacy entities that lack the new fields.

## Initial state

Tickets currently support only singular `source_finding`; resolved findings support one `related_ticket`; existing repositories may contain neither link.

## States

- Legacy entity: provenance fields absent and interpreted as empty/unknown.
- Synthesized ticket: `origin: synthesis` with non-empty sources and full shape metadata.
- Existing-origin ticket: source appended through an immutable-origin shape event.
- Resolved finding: one/multiple linked tickets or a non-ticket disposition payload.

## Transitions

- attach-created/split-created create reciprocal links.
- attach-existing appends both sides while preserving ticket origin.
- Other dispositions record their tagged payload without inventing links.
- Readers normalize singular legacy fields without rewriting files.

## Triggers

Shape-plan application and normal entity parsing/validation. There is no standalone automatic migration.

## Permissions

Only canonical CLI mutations write provenance. Finding→package is derived through ticket membership, never persisted independently.

## Error paths

Reject missing reciprocal links, nonexistent entities, duplicates, synthesis tickets without metadata, invalid disposition payloads, and attach to non-backlog tickets.

## Cancellation path

Provenance changes participate in T-003 staging, so no partial link is published.

## Retry and duplicate-action behaviour

Appending the same source/event is idempotent. A resolved finding cannot receive a second active disposition. Split targets are unique.

## Audit and notification expectations

Append-only `shape_events` record plan hash, timestamp, operation, and added finding IDs while original origin remains visible.

## Current structural problem

Singular links cannot represent clustering or splitting, and attaching to an existing ticket can lose evidence or falsely relabel a human ticket as synthesized.

## Demonstrated cost or risk

Observed T-022 grouped O-101, O-114, and O-87 while all remained open and absent from the ticket, leaving Brief/chat without their evidence.

## Behavioural invariants

- Legacy singular fields still parse.
- Existing ticket origin is immutable.
- Every canonical link resolves and is reciprocal.
- Finding→package remains derived.

## Target structural property

Normalized many-to-many ticket/finding provenance with strict new-write rules, tolerant legacy reads, and append-only synthesis events.

## Excluded redesign

No conversation persistence, proposal entity, bulk legacy rewrite, unrelated migration, or UI layout work.

## Behaviour-preserving verification

Load old fixtures unchanged, round-trip new entities, exercise one-to-many/many-to-one links, and prove existing ticket content/origin changes only where specified.

## Scope

- Schema/parser/model support for synthesis origin, `source_findings`, finding `tickets`, shape metadata, and `shape_events`.
- Bidirectional attach-created, split-created, and attach-existing semantics.
- Backward-compatible normalization of singular legacy fields.
- Workspace-level provenance invariants used by validation and Apply.

## Non-goals

- Rendering/chat prompt changes (T-005).
- Transaction mechanics (T-003).
- Direct finding→package fields.

## Acceptance

- A synthesized ticket requires at least one source finding and complete shape metadata.
- attach-existing preserves target origin and appends one reciprocal source plus one event.
- A split finding resolves to at least two created tickets, each listing that finding.
- Legacy singular/absent provenance loads and validates without rewrite.
- Asymmetric, dangling, duplicate, or lifecycle-illegal links fail workspace validation.

## Verification

- Parser/schema fixtures cover legacy, synthesized, attach-existing, split, and non-ticket dispositions.
- Integration validation creates a graph, breaks each side, and checks precise errors.
- Regression fixture proves a human-origin ticket remains human after attach-existing.

## Constraints

New fields are mandatory only for new synthesis output. Preserve imported `O-*` IDs and schema-v1 repositories.

## Open decisions

None.

## Execution notes

Implement before T-003 and T-005. Prefer normalized arrays in memory while retaining tolerant legacy input.
