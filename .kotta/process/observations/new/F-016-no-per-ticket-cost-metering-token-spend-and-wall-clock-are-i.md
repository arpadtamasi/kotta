---
id: F-016
title: >-
  No per-ticket cost metering — token spend and wall-clock per ticket are
  invisible
status: new
origin: human
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-31'
---
# F-016 — No per-ticket cost metering — token spend and wall-clock per ticket are invisible

## Observation

A-Team records what an agent DID on a ticket (branch, worktree, evidence, review) but never what it COST. There is no token spend, no wall-clock, no retry count attached to a ticket, so nothing in the workspace can answer "what did T-087 cost us?" or "which ticket kind burns the most?".

## Evidence

Operator observation while watching a real package run (2026-07-31). The Run stage shows claims, branches, worktrees and activity timestamps — all provenance, zero economics. The ticket schema has no cost fields; the CLI never captures them at claim/close time; the UI has no place to show them.

The data is available at the boundary A-Team already owns: a ticket is claimed, worked, and closed through `start-ticket` / `execute-ticket` / `close-ticket`. That is the natural place to stamp usage (tokens in/out, model, wall-clock, agent) onto the ticket file, the same way branch and worktree are stamped today.

Why it matters beyond curiosity: cost per ticket is the only honest feedback signal on ticket QUALITY. An under-specified ticket shows up as retries, long runs and burned tokens. Without the number, the cost of bad definition stays invisible and unlearnable. It also makes package-level forecasting possible ("this wave will cost roughly X") and gives the wave view a second dimension to encode.

## Impact hypothesis

Without cost data the workspace cannot tell an expensive ticket from a cheap one, cannot price a package before launch, and cannot connect poor definition to real spend.

## Confidence

High: directly observable — no cost field exists anywhere in the schema, CLI or UI.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Likely shape: a `usage` block stamped on the ticket at close time, aggregated per package, surfaced in Run and Done.
