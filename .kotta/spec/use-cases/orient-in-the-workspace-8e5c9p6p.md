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
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

Answer "where does work stand and what needs a decision" from canonical state, without reading .kotta/ by hand.

## Preconditions

An initialized workspace; for the board, state committed to the base ref.

## Main success scenario

Status reports defined, active, and review tasks, new observations, the discovered workspace path, the control-plane mode, and skill and agent-rules drift, so a stale install is visible. Validate confirms workspace consistency. List and show answer what exists and what one entity says, for every entity kind, with short ids that resolve everywhere. Sweep answers the other question a reader arrives with — not what exists, but what has stopped and why: it derives the unfinished work, gives each item the reason it stopped and the one action that would move it, and orders them by what standing still costs. It reads only what tasks, batches, observations, claims and Git already say, stores nothing, and runs in a workspace that does not validate, because a workspace nobody trusts is when the question gets asked. Where an age decided that waiting counts as stopped, the report names the threshold, so a wrong default is visible rather than silently filtering. Every item the sweep raises has a way to leave it, including the finding that nothing was left behind: a declared deviation that was an interpretation argued and accepted at review is answered by recording that, not by inventing an observation about nothing. A report whose only exit is to create work can only grow, and a list that only grows stops being read - which costs more than the items on it. The same reading answers the narrower question a reader arrives with when they sit down over one entity: what still waits on a human answer here. Open questions are reported for one entity or for every entity at once, each with the position that addresses it, whether it blocks defining, and the decision that settled it where one did. The board projects the same state and the event timeline read-only for the human, and shows an entity's open questions as their own panel that carries the reader to where each one is written.

## Alternatives

The same listings reach the calling chat as read-only tools, so orientation never requires touching files. Reads reflect the base ref through Git plumbing, never the churning working tree; in-flight worktrees appear as overlay with provenance, and disagreement surfaces as drift.
