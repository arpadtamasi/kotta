---
id: EX-01m4kazyqsnc6nyr8j8n3qwkct
form: example
title: "A step back in an open change is caught by the plan"
subjects:
  - BR-01m4kazy06s3yg2d2pgw26f583
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/tervezes-mindent-lat/conversation.md · SZ2"
  quote: "rp, 2026-10-10: „kezeld a hiákat”"
  inferred: "The gaps were the agent's list after the 2026-10-09 work — the plan missed a clash with an approved open change, the distillate missed the human's answers, the plan reported archived citations as unresolved; the operator asked that they be handled. The remedies are the agent's."
---
# A step back in an open change is caught by the plan

## Given

An approved open change whose delta holds *The view holds still* — a view the reader returns to opens where it was left — and a second change whose new rule says stepping back opens a node at its top.

## When

`kotta plan` runs on the second change.

## Then

The report says it laid the first change over the accepted model, and lists *The view holds still* among the conflict candidates.

