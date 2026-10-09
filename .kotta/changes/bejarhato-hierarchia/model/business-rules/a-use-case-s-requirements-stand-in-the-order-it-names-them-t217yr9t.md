---
id: BR-01m4gmdmr2h33x4cr7t217yr9t
form: business-rule
title: "A use case's requirements stand in the order it names them"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".impeccable/critique re-run of 2026-10-09 on the intimity board (design critic, 25/40; detector and post-build checklist)"
    - "chat · rp, 2026-10-09, answers to structured questions: „Igen, így” (the measures as proposed) and „Igen, egyben” (the design critic's other findings in the same change)"
  quote: "rp, 2026-10-09: „Igen, egyben”"
  inferred: "The design critic found requirements sorted A to Z, out of the story's order. That the order a use case gives its `refines` list is the order to show is the agent's choice."
---
# A use case's requirements stand in the order it names them

## Rule

Under a use case the tree SHALL list the requirements in the order the use case's `refines` list names them, and SHALL NOT sort them by title; what falls out with a dropped use case SHALL be listed in that order too, on the board and by `kotta spec impact`. No Kotta command SHALL reorder a `refines` list. The requirements that hold for the whole product and those with no place have no use case to give them an order, and stay by title.

## Rationale

A to Z put "A gentler round…" first among the result's rules and broke the story the use case tells. The use case already lists what it relies on; the board keeps the order the use case lists, so whoever writes the list sets the reading order.

## Scope

The hierarchy view of `kotta ui`.

