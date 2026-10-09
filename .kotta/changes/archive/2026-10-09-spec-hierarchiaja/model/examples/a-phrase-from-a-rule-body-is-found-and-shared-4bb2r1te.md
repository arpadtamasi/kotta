---
id: EX-01m4ghr8w38wt1tweg4bb2r1te
form: example
title: "A phrase from a rule body is found and shared"
subjects:
  - QA-01m4ghr864w6xe125fkvrdptmh
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P2"
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P5"
  quote: "rp, 2026-10-09: „igen ez jó minőségi req-k eddig nem voltak talán”"
  inferred: "The case is the intimity specification as reviewed on 2026-10-09; the viewport and the phrases are the agent's choice of a measurable case."
---
# A phrase from a rule body is found and shared

## Given

The intimity rule *Every new round contains two equal sides*, whose text says "at least three cards per side" and whose title does not.

## When

The human types `/`, searches for "at least three cards", opens the rule, and sends the page's address to a colleague.

## Then

The search finds the rule; the colleague's browser opens the same view with the same search and the rule open.
