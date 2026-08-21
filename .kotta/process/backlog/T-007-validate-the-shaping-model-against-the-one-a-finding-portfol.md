---
id: T-007
title: Validate the shaping model against the one&a finding portfolio
status: backlog
origin: human
types:
  - discovery
profiles:
  - discovery
priority: medium
risk: medium
batch: P-001
depends_on:
  - T-006
blocks: []
branch: null
pull_request: null
created_at: '2026-07-21'
updated_at: '2026-07-21'
---
# T-007 — Validate the shaping model against the one&a finding portfolio

## Outcome

A read-only shaping run over the current one&a open-finding portfolio produces a complete proposed plan and a correction log showing where the human merged, split, rejected, or kept open the model's first pass. The evidence determines whether the V1 schema and heuristics are sufficient before Apply ships.

## Decision to be supported

Whether to implement/release the proposed shape-plan and Apply contract unchanged, revise its action/schema boundaries, or stop because portfolio shaping does not reduce PM effort reliably.

## Research question

Can the workflow account for the real one&a findings and create execution-coherent tickets/packages without hiding provenance or forcing the PM to reconstruct the portfolio manually?

## Hypotheses

- The model will find useful clusters after reading code, but the PM will correct some execution boundaries.
- `split-created` and attach-existing are required by real cases.
- Most correction value will concern merge/split and package membership, not wording.

## Method

Snapshot the one&a workspace, select all currently open findings in batches of at most 100, run T-006 read-only, inspect the generated preview, and ask the PM to correct it in chat. Record first proposal, final proposed plan, correction category/reason, time spent, and any schema action that could not express the desired result. Do not Apply.

## Time or depth limit

One complete portfolio pass, maximum two hours of agent analysis plus 30 minutes of PM correction. Stop if required repository access/evidence is unavailable rather than substituting titles.

## Expected output

- Validator-clean unapplied plan(s) accounting for every selected finding.
- Human correction log with merge, split, attach, package, disposition, and rationale edits.
- Coverage/count summary and list of unexpressible cases.
- Recommendation: proceed, revise specific contract, or abandon.

## Decision criterion

Proceed if every scoped finding is accounted for, no desired correction is unexpressible, no direct canonical write occurs, and the PM judges the final boundaries materially easier than manual triage. Revise if action/schema gaps are bounded; stop if omissions or code-inspection failures are systemic.

## Scope

Current one&a open findings, related existing work/decisions/packages, relevant code inspection, generated preview, and human correction capture.

## Non-goals

Applying the plan, implementing resulting tickets, evaluating production-scale automated grouping, or using Sentry-scale crash grouping as a benchmark.

## Acceptance

- Every selected finding has exactly one final proposed disposition; totals reconcile to scope.
- The initial and corrected plan/preview are retained outside canonical `.a-team` state.
- Each human correction has category and short reason; uncorrected model choices remain distinguishable.
- Before/after canonical workspace digests match.
- A written go/revise/stop recommendation explicitly evaluates schema expressiveness and PM effort.

## Verification

- Reconcile scope IDs against final disposition IDs by script.
- Run T-001 preview on the final plan(s).
- Compare canonical workspace digest before/after.
- Review the correction log with the PM and obtain an explicit go/revise/stop response.

## Constraints

Read-only assignment: do not invoke shape Apply or existing finding-resolution commands. Treat one&a as a tens-to-hundreds portfolio, not a high-volume crash stream.

## Open decisions

None.

## Execution notes

Use the workspace currently served by the one&a control room. This is discovery validation, not a release acceptance shortcut.
