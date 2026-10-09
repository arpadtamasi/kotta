---
id: BR-01m4gmdmhz5zs80j07660yjaeq
form: business-rule
title: "A citation of an archived change still opens"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".impeccable/critique re-run of 2026-10-09 on the intimity board (design critic, 25/40; detector and post-build checklist)"
    - "chat · rp, 2026-10-09, answers to structured questions: „Igen, így” (the measures as proposed) and „Igen, egyben” (the design critic's other findings in the same change)"
  quote: "rp, 2026-10-09: „Igen, egyben”"
  inferred: "The design critic found archived citations failing with ‘No such file’. The operator agreed the finding goes into this change; the remedy is the agent's."
---
# A citation of an archived change still opens

## Rule

Where a node cites a file of a change by its open path — `.kotta/changes/<name>/…` — and no open change has that name, the board SHALL open the file in the archive folder whose name is the date of archiving followed by `<name>`, the latest when several are, and SHALL say that the change is archived. An open change of that name wins. Where neither exists, the source SHALL be marked as broken, with what closes it.

## Rationale

Every node a change lands keeps citing the change by its open path; once the change is archived the path is gone, and the board answered "The narrative could not be read: No such file" on the provenance a reviewer most needs.

## Scope

The sources of a node in `kotta ui`.

