---
id: BR-01m4gvndx1scrdc836cmjp58dq
form: business-rule
title: "The model is shaped the way the product is told to a stranger"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/idegennek-elmondva/conversation.md · J2"
    - "chat · rp, 2026-10-09, answer to a structured question: „Jelezze, ne állítsa meg” (kotta plan names a proposal with no telling, without blocking)"
    - "chat · rp, 2026-10-09, answer to a structured question: „egyenként gondold át — leírtál nekem az appról egy nagyon jól strukturált ismertetőt — hogy mondanád el egy idegennek — ez a feladat (a kottáé mindig)”"
  quote: "rp, 2026-10-09: „hogy mondanád el egy idegennek — ez a feladat (a kottáé mindig)”"
  inferred: "The operator stated the principle and agreed to make it a Kotta rule (J2), and chose that kotta plan names a missing telling without blocking. The rule's shape — the telling first, the parts, inferred until confirmed, quality versus use case for support — is the agent's, revised after the specification critic."
---
# The model is shaped the way the product is told to a stranger

## Rule

When an agent shapes a model — planning a change, or running a workshop — it SHALL first write in the proposal, under `## Told to a stranger`, how the product is told to a stranger in a few sentences: what it is for, how it is used step by step, its variants, and what supports it. It SHALL then propose the model that reads the same way: a purpose the product's goals serve, each journey as a summary use case, variants as extensions; support that is a quality of the product — privacy, access, installation, timeliness and the like — as a quality attribute, and support someone does as a use case off the journey. A purpose or a journey the human has not stated SHALL be drafted as inferred, with an open decision, until the human confirms it; a quality attribute's measure nobody has said SHALL be asked for, as *A quality requirement is recorded where it is said* requires. The import keeps asking and drafts neither (*The import asks what its goals serve*). `kotta plan` SHALL name a proposal that carries no `## Told to a stranger` section, without blocking the gate.

## Rationale

A model that is complete can still be impossible to follow: the intimity import held every rule and example, and still told the product as nine equal goals in alphabetical order. The agent could tell the product clearly in chat; the model was shaped by the narrative's chapters instead. Told to a stranger first, the structure follows the telling; *Validate names a flat structure* checks the result where a check is possible.

## Scope

Every change an agent plans under the rules Kotta ships: the rules file, the `plan-change` skill, the workshop skills and the import's proposal.
