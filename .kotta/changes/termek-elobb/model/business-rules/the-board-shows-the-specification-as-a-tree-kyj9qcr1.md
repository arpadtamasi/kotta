---
id: BR-01m4ee23zg0wx6hyvpkyj9qcr1
form: business-rule
title: "The board shows the specification as a tree"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-10-09: „most nézesd meg a fikázókkal, elmennek-e rajta, én azért még soknak érzem”"
    - ".kotta/changes/archive/2026-10-08-hasznalati-eset-hierarchia/conversation.md · SZ2"
    - ".kotta/changes/archive/2026-10-08-hasznalati-eset-hierarchia/conversation.md · P3"
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ2"
    - "chat · rp, 2026-10-09 14:2x, answers to structured questions after the critics: „Összefoglaló eset” (a summary-level use case that includes the steps carries the journey, no follows edge), „Igen, a célból induljon” (the tree starts from the goal; the actor arrangement one switch away), „Egy change marad”"
  quote: "rp, 2026-10-09: „Igen, a célból induljon” — reversing the 2026-10-08 choice of the actor as the root"
  inferred: "2026-10-09 (termek-elobb): the sentence putting the goals that serve a goal before its use cases is agent-decided — the critics found support use cases leading the purpose; the rest of the rule is as approved before. The operator chose on 2026-10-09 that the tree starts from the goal, with the actor arrangement one switch away, and that a summary use case carries the journey. The journey strip above the goals, the goal order taken from it, the group off every journey and drawing a shared use case once are the agent's design, from the two design critics. Earlier (2026-10-08): the layout by actor, nested include and extend, requirements under each, overall on top, unplaced apart, capability as a filter."
---
# The board shows the specification as a tree

## Rule

The board SHALL offer a view of the specification as a tree that starts from its purpose. Above the tree it SHALL show each journey (*A summary use case tells a journey*) as its steps in order, each step leading to its place in the tree. The tree SHALL hold the overall requirements at the top, then each goal that serves no other goal, the goals that serve it nested under it, and under each goal the use cases that serve it, with their included and extending use cases nested, the requirements each refines, and under each requirement the examples that prove it. Several journeys SHALL stand in title order. A step that is itself a journey SHALL stand in the strip as one step that opens its own journey. A summary use case SHALL be shown as its journey strip and as one row under its goal that does not nest its steps; its steps SHALL be shown in full under the goals they serve. Under a goal, the goals that serve it SHALL come before its use cases, so a purpose reads as its journey first and what supports it after. Sibling goals SHALL stand in the order of the earliest journey step that serves them — the first step, in the first journey in title order, that serves them — and a goal served only by a variant SHALL stand right after the goal of the step it varies; goals none of whose use cases is on a journey SHALL follow, apart, as off every journey, keeping the nesting their `serves` edges give them. Any other use case that stands in more than one place SHALL be shown in full at its first place in the tree's top-to-bottom reading order, and as a reference to that place everywhere else. The arrangement by actor SHALL stay available beside it. Requirements that have no place SHALL be listed apart. A use case SHALL be selectable as dropped, and the board SHALL then mark what falls out and what stays. The capability SHALL filter the tree, never group it.

## Rationale

A flat list by form is hard to read at a few hundred nodes: the rule and the use case it serves never stand side by side. On 2026-10-08 the operator found the oktat-ai specification right laid out by actor. Laid out the same way, the intimity specification showed why the actor alone is not enough: with one actor every use case hung from one root, alphabetically, the goals were missing and the examples were numbers, and a reader could not follow the product from what it is for to what proves it. A human tells a product from its purpose and along its journey; the tree reads the same way, and what is not on the journey reads as what it is — support.

## Scope

`kotta ui`, beside the existing views.
