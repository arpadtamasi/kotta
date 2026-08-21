---
id: F-022
title: >-
  State gates are bypassable because the store is the filesystem — tickets reach
  done by git mv, and validate only notices afterwards
status: new
origin: agent
observation_type: risk
confidence: high
severity: high
discovered_during: null
created_at: '2026-08-01'
---
# F-022 — State gates are bypassable because the store is the filesystem — tickets reach done by git mv, and validate only notices afterwards

## Observation

Ticket state is the directory the file sits in. The CLI enforces gates on transitions it performs — but an agent with file access can move a ticket between states directly, and every gate is skipped. Validation catches the result only if someone runs it later.

## Evidence

oneanda, 2026-07-31 / 08-01. All four gates enabled in `config.yaml`:

```
require_human_ready_approval: true
require_human_done_approval: true
require_verification_for_ready: true
require_review_evidence_for_done: true
```

What happened anyway:

- A state transition performed as a file move, not a command: `git mv .a-team/done/O-120-….md .a-team/review/` with an `mv` fallback.
- `a-team validate` afterwards reporting `MISSING_REVIEW_EVIDENCE` on tickets **already in `done/`** (O-9.1, O-56) — they could not have passed the close gate, so they did not go through it.
- O-56 sitting in `done/` while missing **six** required sections of its own `discovery` profile (Research question, Method, Hypotheses, Decision to be supported, Decision criterion, Time or depth limit). It was never shaped, and it is closed.
- 22 direct `Write`/`Edit` calls into `.a-team/backlog/`, and findings deleted with `rm -f` rather than dispositioned.

None of this is malice — moving a file is the obvious action when the CLI refuses or is not reachable ([[F-023]]). The point is that the gates are advisory by construction.

## Impact hypothesis

Any guarantee A-Team states about its own states is a guarantee about the CLI, not about the workspace. Downstream — the UI, packages, reports, regeneration — all read the directory, which can say anything.

## Confidence

High: the commands and the resulting validation errors are both in the transcripts.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Note the design tension: file-native storage is the product's core claim, so the answer cannot be to lock the files. More likely: make validate part of the commit path (hook) so an out-of-band move is caught within seconds rather than days, and make gate violations loud in the UI rather than only in `validate --json`.
