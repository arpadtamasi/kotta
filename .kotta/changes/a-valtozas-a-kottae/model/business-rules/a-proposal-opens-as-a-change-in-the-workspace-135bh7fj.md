---
id: BR-01m40e0afjevd5jy04135bh7fj
form: business-rule
title: A proposal opens as a change in the workspace
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ1"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P1"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P2"
  quote: "rp, 2026-09-29: „a kottában nem kell megtartani az openspecet, csak mint lehetséges alapot” — „tedd rendbe”"
  inferred: "The folder (.kotta/changes/<name>/), the command names (kotta change new, kotta change list) and the proposal's three sections were chosen by the agent; the operator asked for the inconsistency to be put right, not for these names."
---

# A proposal opens as a change in the workspace

## Rule

Every request to specify, propose or plan something SHALL open as a change of Kotta's own, at `.kotta/changes/<name>/`, created with `kotta change new <name>`, whether or not the project uses OpenSpec. The change SHALL hold the proposal in prose (`proposal.md`: why, what changes, what is still undecided), the distilled conversation when there is one, and the model delta under `model/`; `kotta plan`, `kotta approve` and `kotta archive` SHALL read the change there, and archive SHALL move it to `.kotta/changes/archive/`. Kotta SHALL NOT write a change under `openspec/`. The workshop skills SHALL draft their nodes into a change (`kotta spec new … --into <change>`), never straight into the accepted specification.

## Rationale

The change used to live in OpenSpec's folder, so the same request had two outcomes: in one project an agent created an OpenSpec tree to put the proposal in, in another it wrote a free-standing document that never became a change, and no node reached the model. The operator wants OpenSpec kept only as a possible basis. One home for every change makes the request mean the same thing everywhere, and drafting into a change keeps every node behind the one gate.

## Scope

Every Kotta workspace, every agent and every command that opens, plans, approves or archives a change. An existing OpenSpec project still comes in through `kotta import openspec`, which opens a change here like any other.
