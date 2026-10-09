---
id: BR-01m4gmdmcjc5rcf90rh8hjz3g3
form: business-rule
title: "The drawer opens a node at its top"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".impeccable/critique re-run of 2026-10-09 on the intimity board (design critic, 25/40; detector and post-build checklist)"
    - "chat · rp, 2026-10-09, answers to structured questions: „Igen, így” (the measures as proposed) and „Igen, egyben” (the design critic's other findings in the same change)"
  quote: "rp, 2026-10-09: „Igen, egyben”"
  inferred: "The design critic found that a node opened from another lands mid-text. The operator agreed the finding goes into this change; the remedy is the agent's."
---
# The drawer opens a node at its top

## Rule

When the drawer opens a node from a list or from another node, it SHALL show the node from its top, and SHALL move the focus to the node's title. Stepping back SHALL return to the node before where the reader left it, as *The view holds still* promises of a view.

## Rationale

Opening a related node kept the scroll of the one before: the reader landed in the middle of a text with no title in sight, and a screen reader stayed where it was.

## Scope

The node drawer of `kotta ui`.

