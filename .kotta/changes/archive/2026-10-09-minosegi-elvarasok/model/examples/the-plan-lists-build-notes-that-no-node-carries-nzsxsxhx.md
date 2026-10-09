---
id: EX-01m4gj0f0zga6schnfnzsxsxhx
form: example
title: "The plan lists build notes that no node carries"
subjects:
  - BR-01m4gj0endmfx601pm929wcp41
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "chat · rp, 2026-10-09 14:4x: „a quality req-t pedig egy új change-be dobd be” — and, asked what the new change should hold: „hogy a kotta figyeljen rájuk és ha felmerül egy ilyen, jelezze ls vegye fel”"
    - ".kotta/changes/minosegi-elvarasok/conversation.md · P2"
  quote: "rp, 2026-10-09: „miért nem védo ezeketz semmi?”"
  inferred: "The case is the spec-hierarchiaja change as planned on 2026-10-09; the wording is the agent's."
---
# The plan lists build notes that no node carries

## Given

A proposal whose What changes lists, after the nodes it names by title, ten items such as "the 9px labels become at least 11px" and "search matches body text", which name no node.

## When

`kotta plan` runs.

## Then

The report lists the ten items as candidates, each asking whether it is a promise that needs a node or work that keeps none; the change can still go to the gate.
