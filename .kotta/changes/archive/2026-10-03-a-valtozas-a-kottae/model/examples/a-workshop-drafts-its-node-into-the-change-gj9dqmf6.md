---
id: EX-01m40e0b6zc70bbzdhgj9dqmf6
form: example
title: A workshop drafts its node into the change
capability: planning-phase
subjects:
  - BR-01m40e0afjevd5jy04135bh7fj
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P2"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P4"
  quote: "rp, 2026-09-29: „tedd rendbe, máshol is kavarodik”"
  inferred: That the workshop skills drafted into the accepted specification was found by the agent while looking for other places that confused the flow.
---

# A workshop drafts its node into the change

## Given

An open change, and the use-case workshop drafting a use case with the human.

## When

The workshop asks Kotta for the node.

## Then

The node is minted with `kotta spec new use-case --title … --into <change>` under the change's `model/`; `.kotta/spec/` is untouched until the change is approved and archived.
