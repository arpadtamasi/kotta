---
id: EX-01m3f1eax7v7xsq6zfsk087v74
form: example
title: "A comment-only scenario is named in a warning"
capability: migration
subjects:
  - BR-01m3cqmtnnwxz7fkyr6d5ch9e6
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
  quote: "rp, 2026-09-26, chat: a comment-only requirement or scenario gets a warning naming the capability and the section, not only a silent skip."
---

## Given

An `openspec/specs/<capability>/spec.md` in which one scenario under a requirement holds only a Markdown comment.

## When

`kotta import openspec` runs.

## Then

No example is drafted from that scenario, and among its warnings the import names the capability and the scenario as a section with no text.
