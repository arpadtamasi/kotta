---
id: QA-01m0f0wn89nx49z82gh2ssx6j1
form: quality-attribute
title: "Deterministic reads"
---

## Source

Any caller - human, agent, or automation - reading workspace state.

## Stimulus

Repeated status, list, or show calls against an unchanged workspace.

## Environment

Any surface: CLI, MCP read tools, the board's GET endpoints.

## Artifact

The read commands and the read-only tool surface.

## Response

The same workspace yields the same bytes, and nothing is written - not even the index.

## Measure

Byte-identical repeated output; zero filesystem writes observed during reads.
