---
id: QA-01m0f0wn89nx49z82gh2ssx6j1
form: quality-attribute
title: "Deterministic reads"
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
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
