---
id: BR-01m4gg8wd62m9h75yczmmzphs7
form: business-rule
title: "The use-case diagram draws how use cases relate"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "chat · rp, 2026-10-09 13:5x, answer to a structured question: „Séma + board együtt” (the goal form gets a goal-serves-goal edge, the use cases an order, the board builds on them) and „Mind az öt” (all five board findings)"
    - ".kotta/changes/spec-hierarchiaja/conversation.md · P2"
  quote: "rp, 2026-10-09: „egyetértek (és ahol meg van, ott rendes UML)”"
  inferred: "The operator asked for proper UML wherever it has a notation (conversation P2, left unpaired by the distiller, so not cited as an approval). Which shapes, the goals outside the boundary and the Mermaid fallbacks are the agent's reading of UML's use-case diagram."
---
# The use-case diagram draws how use cases relate

## Rule

The board's use-case diagram SHALL draw in UML use-case notation wherever UML has one: actors as stick figures outside the system boundary, use cases as ellipses inside it, an actor's association as a plain line, and every `includes` and `extends` edge between use cases as a dashed open arrow labelled «include» or «extend». Each shape SHALL keep what *The board draws its own diagrams, and Mermaid is one switch away* promises of a node: its provenance frame, opening on a click, lighting its connections on hover. What UML does not draw — the goals — SHALL stand outside the system boundary, laid out before it in reading order (left of it, or above), each joined to the use cases that serve it by a dotted line. Mermaid, which has no UML shapes, SHALL draw a use case as a rounded node, an actor as a labelled node and «include» or «extend» as a dotted link with its label.

## Rationale

The diagram is the one picture of the use cases, and it drew only actors and goals: in intimity the evening apart, which extends the everyday deal, stood beside it as an unrelated sibling, and the goals sat at the far end as leaves, after everything they are for.

## Scope

The use-case diagram of `kotta ui`, in both renderers.
