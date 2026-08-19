---
id: T-006
title: Add a read-only VS Code shaping workflow for code-aware finding clustering
status: backlog
origin: human
types:
  - feature
profiles:
  - discovery
  - workflow
priority: medium
risk: medium
batch: P-001
depends_on:
  - T-001
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-006 — Add a read-only VS Code shaping workflow for code-aware finding clustering

## Outcome

A VS Code agent conversation can inspect an explicit finding scope, relevant code, existing tickets/packages/decisions, and produce a reviewable shape-plan proposal plus human preview. It never mutates PM state until the user separately invokes the approved Apply command.

## Decision to be supported

Which findings should become zero, one, or several executable tickets, which tickets share an optional package, and which non-ticket disposition each remaining finding receives.

## Research question

Can broad repository context and implementation/verification cost produce better ticket boundaries than title similarity or manual multi-select at A-Team's tens-to-hundreds scale?

## Hypotheses

- Semantic similarity is useful for candidate clusters but insufficient as a ticket boundary.
- Independent small findings can rationally share one ticket when one execution/review session is cheaper and coherent.
- Explicit code/evidence inspection and human merge/split corrections are necessary trust boundaries.

## Method

Extend/reuse `explore-workspace`: accept up to 100 explicit open findings, read full evidence and every code/config file used by a rationale, search existing work and decisions, propose complete contracts/dispositions, write a local plan file, and call read-only preview. Uninspected or uncertain work remains investigate/keep-open.

## Time or depth limit

Maximum 100 findings per plan. Batch larger portfolios into non-overlapping scopes. Stop analysis for a finding when required evidence cannot be obtained within the declared repository context and preserve it as open.

## Expected output

- Concise cluster/ticket/package rationale in chat.
- Complete machine plan conforming to T-001 with declared inspected files.
- Derived preview and plan hash.
- Explicit unresolved uncertainties and no canonical changes.

## Decision criterion

Adopt when a real portfolio run accounts for every scoped finding, exposes enough reasoning for a PM to correct boundaries, and emits a validator-clean preview without direct writes.

## Actors

- PM sets scope and corrects merge/split/priority choices.
- VS Code shaping agent performs portfolio/code analysis.
- Explore/preview commands provide read-only canonical context and validation.

## Initial state

An initialized workspace with open findings and optional existing backlog work. The user explicitly identifies all findings in scope or requests a bounded open-finding selection.

## States

`scoped → inspected → proposed → revised → previewed`; canonical PM state remains unchanged throughout.

## Transitions

Inspection requires evidence/code reads; proposal requires one disposition per scoped finding; user feedback revises group boundaries; preview requires T-001 validation.

## Triggers

Natural-language requests such as “review these open findings and shape executable tickets/packages” in the existing VS Code agent chat.

## Permissions

The shaping workflow is read-only. It may create a noncanonical local plan file but cannot write `.a-team`, resolve findings, or start tickets. Apply requires a separate explicit user instruction and CLI hash approval.

## Error paths

Missing evidence, unavailable files, context overflow, ambiguous target, existing overlap, or invalid preview is surfaced per finding. The workflow uses investigate/keep-open rather than silently omitting or guessing.

## Cancellation path

Stopping the chat leaves only an optional local plan draft; no canonical decision exists and no rollback is necessary.

## Retry and duplicate-action behaviour

The same explicit scope may be reshaped until Apply; latest previewed plan supersedes earlier chat proposals but does not delete them from chat history. Scoped findings must be unique.

## Audit and notification expectations

Chat reports inspected files, existing-work matches, merge/split rationale, every disposition, uncertainties, and the exact preview hash. It labels the plan as unapplied.

## Scope

- Skill/prompt workflow extending existing workspace exploration.
- Explicit scope and context-budget rules.
- Code-aware boundary heuristics based on coherent implementation, verification, and review cost.
- Plan emission and preview invocation.

## Non-goals

- A new global web chat, persistent proposal entity, autonomous Apply, prioritization scheduler, or direct file mutation.
- Finding/package entity chats; those are a later product phase.

## Acceptance

- Every scoped finding appears exactly once in the proposed dispositions and none outside scope appears.
- Every mutating proposal cites read evidence and relevant inspected files; uncertainty stays open.
- Output may create 0–N tickets/packages and supports both merge and split corrections.
- Generated plan passes T-001 preview and the chat clearly states no changes were applied.
- Existing tickets, resolved findings, decisions, and packages are checked before proposing new work.

## Verification

- Skill fixture with duplicates, one composite finding, existing overlap, missing evidence, and unrelated thematic similarity.
- Run on the one&a portfolio under T-007 and record human corrections.
- Confirm filesystem digest before/after the shaping conversation is identical except for the explicitly chosen noncanonical plan file.

## Constraints

The conversation may be long, but must obey the explicit 100-finding scope and progressive code inspection. Do not treat model confidence as approval.

## Open decisions

None.

## Execution notes

Implement after T-001. Reuse `explore-workspace`; do not fork a second portfolio-analysis skill unless the command surface requires a thin wrapper.
