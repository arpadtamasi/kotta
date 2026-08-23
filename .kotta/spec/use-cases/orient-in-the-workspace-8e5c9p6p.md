---
id: UC-01m0f0wn89m98wpkqq8e5c9p6p
form: use-case
title: "Orient in the workspace"
actor:
  - A-01m0f0wn89w35y4k8nngzgemz8
goal:
  - G-01m0f0wn89zx3nr6h1vtd9jg9h
interfaces:
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
  - IF-01m0f0wn898ggsdxa0kh6t6tnw
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Answer "where does work stand and what needs a decision" from canonical state, without reading .kotta/ by hand.

## Preconditions

An initialized workspace; for the board, state committed to the base ref.

## Main success scenario

Status reports defined, active, and review tasks, new observations, the discovered workspace path, the control-plane mode, and skill and agent-rules drift, so a stale install is visible. Validate confirms workspace consistency. List and show answer what exists and what one entity says, for every entity kind, with short ids that resolve everywhere. The board projects the same state and the event timeline read-only for the human.

## Alternatives

The same listings reach the calling chat as read-only tools, so orientation never requires touching files. Reads reflect the base ref through Git plumbing, never the churning working tree; in-flight worktrees appear as overlay with provenance, and disagreement surfaces as drift.
