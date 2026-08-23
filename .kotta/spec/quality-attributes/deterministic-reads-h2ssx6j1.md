---
id: QA-01m0f0wn89nx49z82gh2ssx6j1
form: quality-attribute
title: "Deterministic reads"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
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
