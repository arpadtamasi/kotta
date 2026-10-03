---
id: BR-01m40e522gtq49knhy51hr9e3d
form: business-rule
title: The board shows what waits at the gate
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/a-tabla-mutatja-a-valtozast/conversation.md · SZ1"
  quote: "rp, 2026-10-02: „change-et nem mutat a ui, pedig...”"
  inferred: "The operator reported that the board shows no change. What it should show — a selector, the merged model with marks, the proposal and its state — is the agent's design, not yet approved."
---

# The board shows what waits at the gate

## Rule

The board SHALL list every open change beside the accepted specification, and SHALL let the reader open one. An opened change SHALL show the model as it would be after the change — the accepted nodes with the delta applied — with every node the change adds, changes or removes marked as such, the diagrams drawn from that merged model, and beside it the change's proposal, its open decisions, and whether it has been planned and approved. The accepted view SHALL stay what it is: the agreed specification, unaffected by any open change. The board SHALL remain read-only: nothing is planned, approved or archived from it.

## Rationale

Since every proposal opens as a change and reaches the accepted specification only through the gate, the work that waits for the human's decision lives entirely in changes. A board that shows only the accepted specification is empty exactly when the human has to decide: in two projects the whole first slice sat in a change and the board showed nothing.

## Scope

`kotta ui`, for every workspace with an open change under `.kotta/changes/`. Archived changes are history and are not listed.

## Open decisions

- **Honnan olvassa a board a nyitott változást?** A board ma szigorúan a Gitből olvas: csak azt mutatja, ami a fő ágon commitolva van, a munkakönyvtárat soha — ez egy elfogadott ígérete. Egy készülő változás viszont jellemzően még nincs commitolva; a két wing-projektben egyetlen commit sincs. (a) A nyitott változást a munkakönyvtárból olvassa, jól láthatóan „nincs commitolva” jelöléssel; az elfogadott nézet marad a Gitből. Ehhez a board ígéretét ki kell egészíteni ezzel az egy kivétellel. (b) Csak commitolt változást mutat (bármelyik ágon); amíg nincs commit, a board azt írja ki, hogy a változás létezik, de még nincs commitolva. Én az (a)-t javaslom: a kapunál a még nem commitolt javaslatot is látni kell, különben a board épp ott hallgat, ahol kellene.
