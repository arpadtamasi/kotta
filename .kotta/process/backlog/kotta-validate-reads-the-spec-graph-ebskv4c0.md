---
id: T-01m0fq31gx2wpe2jzaebskv4c0
title: kotta validate reads the spec graph
status: backlog
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
  - BR-01m0fp2hdkwaqamzj5b9wke276
  - EX-01m0fp2hdkyxnkk3wvk6wse31x
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
---
## Outcome

`kotta validate` reads the spec graph: a reference to a missing node, a required edge left dangling, or a form violation in a spec node fails validation with the node, the edge and the corrective action named. The broken-reference-passes-green defect (F-01m0fm0pedh7q04jsp5cnxb5vb) is closed at the tool seam, not in a skill.

## Scope

Workspace validation: parse spec frontmatter against the form registry (required frontmatter, body headings, edge fields and minimums, id shape), resolve every referenced id, and report per node. Read-only, deterministic, part of the existing validate run.

## Non-goals

No new command - this extends validate. No prose analysis; structure only. The traceability skill remains the conversational layer on top.

## Acceptance

- A spec edge naming a nonexistent id fails validate, naming source node, field and target.
- A node missing a form-required heading or minimum edge fails with the registered question or heading named.
- A clean workspace validates green with zero writes (deterministic reads hold).

## Verification

- Integration tests over a fixture workspace with each defect class.
- A byte-identical repeated-run test asserting no writes.

## Constraints

The form registry in the workspace is the only source of form knowledge - nothing hard-codes the shipped forms.

## Open decisions

None.

## Execution notes

Spec side: "What the tool enforces, the spec states", "A broken spec reference fails validate".
