---
id: BR-01m40e522gtq49knhy51hr9e3d
form: business-rule
title: The board shows what waits at the gate
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/archive/2026-10-03-a-tabla-mutatja-a-valtozast/conversation.md · SZ1"
    - ".kotta/changes/archive/2026-10-03-a-tabla-mutatja-a-valtozast/conversation.md · P1"
    - ".kotta/changes/spec-hierarchiaja/conversation.md · J1"
    - "chat · rp, 2026-10-09 13:5x, answer to a structured question: „Mind az öt”"
  quote: "rp, 2026-10-02: „change-et nem mutat a ui, pedig...”"
  inferred: "2026-10-09: opening on the one open change, or on the list of several, when nothing is accepted yet is the agent's remedy for the design review's finding. Earlier: the operator reported that the board shows no change, and chose that an open change is read from the working tree, marked as not committed (option a). What the board shows of a change - the merged model, the marks, the proposal and its state - is the agent's design."
---

# The board shows what waits at the gate

## Rule

The board SHALL list every open change beside the accepted specification, and SHALL let the reader open one. An opened change SHALL show the model as it would be after the change — the accepted nodes with the delta applied — with every node the change adds, changes or removes marked as such, the diagrams drawn from that merged model, and beside it the change's proposal, its open decisions, and whether it has been planned and approved. An open change SHALL be read from the working tree, so a change not yet committed is shown, and every part of it not committed SHALL be marked as such. The accepted view SHALL stay what it is, read from the base ref as before: the agreed specification, unaffected by any open change. When the accepted specification has no node and exactly one change is open, the board SHALL open on that change; with several open and nothing accepted, it SHALL open on the list of open changes. The board SHALL remain read-only: nothing is planned, approved or archived from it.

## Rationale

Since every proposal opens as a change and reaches the accepted specification only through the gate, the work that waits for the human's decision lives entirely in changes. A board that shows only the accepted specification is empty exactly when the human has to decide: in two projects the whole first slice sat in a change and the board showed nothing. Listing the change was not enough: in intimity the board still opened on an empty accepted view saying "0 nodes", with the 226-node change a small item at the side.

## Scope

`kotta ui`, for every workspace with an open change under `.kotta/changes/`. Archived changes are history and are not listed.
