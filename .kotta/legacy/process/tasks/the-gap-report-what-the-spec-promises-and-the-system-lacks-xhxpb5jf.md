---
id: T-01m0fq31tbjb4xpdybxhxpb5jf
title: 'The gap report: what the spec promises and the system lacks'
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on:
  - T-01m0fq31gx2wpe2jzaebskv4c0
blocks: []
spec:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
  - EX-01m0fpqfysk1bwdr53jdk7rtk6
  - QA-01m0f0wn89nx49z82gh2ssx6j1
branch: >-
  feat/T-01m0fq31tbjb4xpdybxhxpb5jf-the-gap-report-what-the-spec-promises-and-the-system-lacks
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
assigned_agent: codex
worktree: .worktrees/T-01m0fq31tbjb4xpdybxhxpb5jf
execution_mode: fresh
branch_origin: created
start_ref: coord/P-01m0fq77101axprvcjwrq3bs61
start_commit: ef86ca51af1888a3a2a83596adb773ea12d9f00b
dependency_integration_target: coord/P-01m0fq77101axprvcjwrq3bs61
resolution: completed
approved_by: cli
approved_at: '2026-08-20T21:06:40.831Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

A read that answers, from the repository alone, what the accepted spec promises that the running system does not implement or verify - in both directions: promises with no implementing evidence, and enforced behavior no node states. Fresh landings are reported delta-first: the diff's nodes lead. The report is the input to defining tasks; it creates nothing itself.

## Scope

A new read operation (CLI subcommand and MCP tool) over the accepted spec on the base branch: per node, look for implementing or verifying evidence (code, tests, commands) and report gaps by node title with the evidence looked for; list deliberately accepted gaps with their recorded reason; order a fresh delta's nodes first. Deterministic, zero writes.

## Non-goals

No task or observation creation. No semantic completeness proof - the report names where it looked and what it did not find, and the human line judges. No CI wiring in this task.

## Acceptance

- The command reports a spec node whose promise has no implementing evidence, naming the node by title and the evidence sought.
- The reverse direction reports an enforced behavior (a validation rule, a gate) that no spec node states.
- Repeated runs on an unchanged repository yield identical bytes and no filesystem writes.
- After a spec landing, the changed nodes lead the report.

## Verification

- Integration tests over fixture workspaces for both directions, the delta-first ordering, and byte-identical repetition.

## Constraints

Builds on the spec-graph reader shipped by the validate task; the registry is the only source of form knowledge.

## Open decisions

None.

## Execution notes

Spec side: "Analyze the implementation gap", "The gap report names the unimplemented promise", deterministic reads QA.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The command reports a spec node whose promise has no implementing evidence, naming the node by title and the evidence sought. | tests/integration/gap-report.test.ts verifies missing accepted nodes by title, exact node id and the searched evidence; src/commands/gap.ts builds the report. |
| The reverse direction reports an enforced behavior (a validation rule, a gate) that no spec node states. | tests/integration/gap-report.test.ts verifies the untraced approval gate; enforcementSites reports validation codes and gate errors lacking a nearby node id. |
| Repeated runs on an unchanged repository yield identical bytes and no filesystem writes. | tests/integration/gap-report.test.ts snapshots the fixture, compares repeated JSON bytes and confirms clean git status. |
| After a spec landing, the changed nodes lead the report. | tests/integration/gap-report.test.ts verifies latest accepted spec delta ordering before older gaps. |

### Verification performed

The command reports a spec node whose promise has no implementing evidence, naming the node by title and the evidence sought.: tests/integration/gap-report.test.ts verifies missing accepted nodes by title, exact node id and the searched evidence; src/commands/gap.ts builds the report.
The reverse direction reports an enforced behavior (a validation rule, a gate) that no spec node states.: tests/integration/gap-report.test.ts verifies the untraced approval gate; enforcementSites reports validation codes and gate errors lacking a nearby node id.
Repeated runs on an unchanged repository yield identical bytes and no filesystem writes.: tests/integration/gap-report.test.ts snapshots the fixture, compares repeated JSON bytes and confirms clean git status.
After a spec landing, the changed nodes lead the report.: tests/integration/gap-report.test.ts verifies latest accepted spec delta ordering before older gaps.

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
