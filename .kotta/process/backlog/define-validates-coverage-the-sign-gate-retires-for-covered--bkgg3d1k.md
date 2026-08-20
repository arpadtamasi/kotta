---
id: T-01m0fq30yzdteeqa14bkgg3d1k
title: Define validates coverage; the sign gate retires for covered tasks
status: backlog
origin: human
types:
  - workflow
profiles: []
priority: medium
risk: medium
batch: P-01m0fq77101axprvcjwrq3bs61
depends_on:
  - T-01m0fq30n1ntmbvamm6vs5h0w6
blocks: []
spec:
  - BR-01m0fp2hdkqz08arp5ebt122r9
  - BR-01m0fp2hdkfn519h1w84jsrqbe
  - GT-01m0fp2hdkehmnew23k3xek5cm
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
  - UC-01m0f0wn89tta6w4w3a7zw45xr
  - QA-01m0fp2hdkq55yrx9qr5t8pweh
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
---
## Outcome

Coverage becomes the define check and the sign gate retires for covered tasks. Define verifies that every acceptance condition is covered by an accepted spec node the task references; a covered task passing validation is defined - no separate human sign follows, because the agreement was accepted when the referenced spec landed on the base branch. A spec-covered task crosses exactly one human gate: close. The one-gauge defect (F-01m0f2zh16pvet8pz3tsb4m5qh) is resolved by mechanism, not by a weight field.

## Scope

Define validation: acceptance-to-spec coverage (each acceptance bullet names or maps to a referenced accepted node; unreferenced acceptance is a named validation failure). The sign step and require_human_sign_approval semantics: covered tasks proceed defined without the gate; the config flag remains for workspaces that opt to keep it. Brief assembly already embeds spec nodes - the coverage map joins it. Skills and AGENTS.md template wording for the changed lifecycle.

## Non-goals

No semantic proof that code will satisfy the node - coverage is a named, checkable reference relation, as the glossary defines it. No change to close, cancel, reopen gates. No retroactive unsigning.

## Acceptance

- Define refuses a task with an acceptance condition covered by no referenced accepted spec node, naming the condition.
- A covered task reaches defined with no sign interaction, and start/execute accept it.
- With the workspace opt-in flag set, the sign gate still elicits - and records its receipt.
- Uncovered need mid-definition is guided to the observation path in the refusal text.

## Verification

- Integration tests: covered task defines and executes; uncovered acceptance refused by name; opt-in flag keeps the gate.
- Brief test asserting the coverage map appears.

## Constraints

Depends on approval receipts so the remaining gates record what the removed gate no longer asks. Existing defined tasks stay defined.

## Open decisions

None.

## Execution notes

Spec side: "A task executes accepted spec, and nothing else", "The spec is the agreement", Coverage, task lifecycle SM, "Define a task", "Proportionate ceremony".
