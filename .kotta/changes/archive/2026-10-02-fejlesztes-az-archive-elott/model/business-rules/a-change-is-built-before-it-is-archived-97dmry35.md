---
id: BR-01m3w9ajdxbf04ph4y97dmry35
form: business-rule
title: A change is built before it is archived
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/proposal.md · Why"
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P1"
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
  quote: "rp, 2026-10-01 17:34 UTC: archive nem a fejleszés után kell? […] szerintem ha approve, akkor van egy change; ha archive-olom, akkor mit fejlestünk?"
  inferred: "The operator said the order; the wording of the rule, that the order stays advice and not a barrier, and that the agent offers the work after recording the yes were supplied by the agent. That archive refuses a change with an unaccounted promise was proposed by the agent and accepted by the operator ('3 ok', conversation P3); where archive looks for the evidence is the agent's."
---
# A change is built before it is archived

## Rule

An approved change SHALL stay open, in the workspace's changes directory, while the code that keeps its promises is written; `kotta archive` is the act that closes it, once the change is built or the human says to close it. The shipped rules file and the `plan-change` skill SHALL name the order plan → gate → implement → archive, and an agent that has just recorded the human's yes SHALL offer the work the change describes as the next step, not the archive. `kotta archive` SHALL refuse a change that holds a promise neither evidenced nor admitted - a node of its delta that no code, test or command definition names and that carries no admission -, SHALL name each such node, and SHALL leave the repository as it was; evidence is sought as the gap report seeks it for an open change. That refusal is a check and no second gate: nobody is asked anything again. The order is advice and never a barrier: an approval is not a permission to write code and its absence is not a prohibition, and *Say when the code runs ahead of the spec* holds as it stands.

## Rationale

The operator, shown an offer to archive a change of which nothing was built yet: "ha archive-olom, akkor mit fejlesztünk?" While a change is open it is the answer to that question: the proposal, the delta and the approval sit in one place, and what is left of it can be measured. Archived first, the change leaves for the archive before any of it exists, its unbuilt promises dissolve into the workspace-wide list of admitted gaps, and each needs an `unimplemented` admission written only so that the landing is not refused. The reason the earlier order gave - that code should cite accepted nodes - never required it: an identifier is minted when the node is drafted into the change, and it does not change when the node lands.

## Scope

Every change in a Kotta workspace; the shipped rules file and the `plan-change` skill, which carry the order to the agent. Not the gate: `kotta approve` asks and refuses what it did. Not the CLI as an enforcer of the order: it does not see code being written.
