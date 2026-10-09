---
id: BR-01m4gmdmy4keq12tj73ahtskx0
form: business-rule
title: "A broken reference and an unreadable change are said, with what to do"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "chat · rp, 2026-10-09: „meg kéne nézetni” (heuristic 9, error states, to be checked after the build)"
    - ".impeccable/critique re-run of 2026-10-09 on the intimity board (design critic, 25/40; detector and post-build checklist)"
    - "chat · rp, 2026-10-09, answers to structured questions: „Igen, így” (the measures as proposed) and „Igen, egyben” (the design critic's other findings in the same change)"
  quote: "rp, 2026-10-09: „meg kéne nézetni”"
  inferred: "The operator asked that error states be checked; the post-build check found both failing. The remedy and its wording are the agent's."
---
# A broken reference and an unreadable change are said, with what to do

## Rule

A reference to a node that does not exist SHALL be marked as broken wherever the board shows it — in the list and among a node's relations — and SHALL say what closes it: add the node, or correct or remove the reference. A change whose model holds a node the board cannot read SHALL be shown with that node named as unreadable and the reason, never left out in silence.

## Rationale

A broken reference looked exactly like a working one until it was clicked, and a change with one malformed file showed as an empty change with nothing to say why; `kotta validate` knew both.

## Scope

`kotta ui`, on the accepted specification and on every open change.

