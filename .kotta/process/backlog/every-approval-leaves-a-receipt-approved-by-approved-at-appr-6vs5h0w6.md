---
id: T-01m0fq30n1ntmbvamm6vs5h0w6
title: 'Every approval leaves a receipt: approved_by, approved_at, approval_basis'
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
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
  - UC-01m0f0wn89p42025mt5vg5012n
  - EX-01m0f0wn8am4hb2vy03wmn4brs
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
---
## Outcome

Every approval-carrying mutation records its receipt on the entity it approved: `approved_by`, `approved_at`, `approval_basis`. The gate stops being ceremony without evidence (F-01kz678s2x51xy0jhfmd9f1zcv): after the fact, the record shows that an approval happened, who gave it, and on what basis - which is what makes a chat-relayed approval auditable.

## Scope

Close, cancel, reopen, batch close, observation resolve, decision create - CLI and MCP alike. The entity schemas gain the three fields; approval_basis carries a short provenance ("chat yes, 2026-08-20, session …" or the elicitation reference). approval_request wiring passes the basis through.

## Non-goals

No identity verification of who typed a terminal command - the receipt records the claimed basis, it does not authenticate it. No re-stamping of historical transitions.

## Acceptance

- Each gated mutation writes approved_by, approved_at and approval_basis to the entity, visible in show output on both surfaces.
- A gated mutation without approval is refused naming the rule, exactly as before.
- The published schemas include the fields and validation checks them on gated states.

## Verification

- Integration tests per gated command asserting the receipt lands and survives round-trips.
- A show-output test that the receipt is human-readable.

## Constraints

Entities approved before this task simply lack the fields; absence is legal history, not an error.

## Open decisions

None.

## Execution notes

The spec side: "Consequential transitions are human gates" (recording clause), "Approve a gate in conversation", "An approval leaves a receipt".
