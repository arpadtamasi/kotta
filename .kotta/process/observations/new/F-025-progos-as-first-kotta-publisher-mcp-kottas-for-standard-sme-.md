---
id: F-025
title: Progos as first kotta publisher — MCP kottas for standard SME software
status: new
origin: human
observation_type: product
confidence: low
severity: medium
discovered_during: null
created_at: '2026-08-01'
---
# F-025 — Progos as first kotta publisher — MCP kottas for standard SME software

## Observation

Parked idea from the operator (2026-08-01, naming session): Progos could publish **MCP kottas for standard SME software** — invoicing, accounting, inventory, CRM and similar categories that every small company runs.

The underlying thesis (operator's words, generalized): in the past people wanted an app; now they want their data reachable from AI, some functions supported, others automated. What dissolves is the app; what remains is data + a capability layer (tools an agent may call, policies for what it may decide). A kotta describes that layer for one domain. A *publisher* ships kottas for the standard domains.

## Evidence

None yet — this is a hypothesis, deliberately parked during a session that was about something else (the regeneration test design). Recorded so it does not evaporate in chat, per the operator's own rule that parked questions must land somewhere real.

Two things make it worth keeping:

- It is the first **named** candidate market in the product's history. The D5 diagnostic question ("name the company this hurts") went unanswered; this answers it sideways — the first name is Progos itself, as publisher, with its SME clients as the users.
- oneanda is already an existing instance of the shape: MCP server + data + thin app, driven from AI chat. The pattern would be repeated per domain, not invented.

## Impact hypothesis

If the capability-layer thesis holds, standard SME categories are where kottas commoditize fastest — and where a small publisher with local (Hungarian) domain knowledge of invoicing/accounting rules could move before platform vendors cover the long tail.

## Confidence

Low: pure hypothesis, no demand evidence, and the session that produced it explicitly deferred all market work (premise 4 of the 2026-08-01 design doc).

## Suggested disposition

Park until the regeneration zeroth run (design doc 2026-08-01) produces its failure-mode report. If the kotta can regenerate oneanda's MCP layer, this finding is the natural next question; if it cannot, this finding is moot. Do not schedule before that.
