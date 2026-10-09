---
id: EX-01m4gmdp0mehp38zeye60apv59
form: example
title: "A change with an unreadable node says so"
subjects:
  - BR-01m4gmdmy4keq12tj73ahtskx0
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".impeccable/critique re-run of 2026-10-09 on the intimity board (design critic, 25/40; detector and post-build checklist)"
  quote: "rp, 2026-10-09: „alig navigálható a hierarchia... nekem”"
  inferred: "An illustrative case, not intimity's: the post-build check built it in a scratch workspace on 2026-10-09; the wording is the agent's."
---
# A change with an unreadable node says so

## Given

An open change whose model holds a node with malformed frontmatter.

## When

The human opens the change on the board.

## Then

The change's header names the unreadable file and why it cannot be read; the change is not shown as empty.

