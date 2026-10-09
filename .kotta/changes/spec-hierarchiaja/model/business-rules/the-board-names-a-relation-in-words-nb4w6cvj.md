---
id: BR-01m4gg8w74b37208tgnb4w6cvj
form: business-rule
title: "The board names a relation in words"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "chat · rp, 2026-10-09 13:5x, answer to a structured question: „Séma + board együtt” (the goal form gets a goal-serves-goal edge, the use cases an order, the board builds on them) and „Mind az öt” (all five board findings)"
  quote: "rp, 2026-10-09: „Mind az öt”"
  inferred: "The remedy — the node's own text first, a phrase per direction, the place in the tree, the opened path in the address — is the agent's, completed after the design critic."
---
# The board names a relation in words

## Rule

Where the board shows a node it SHALL first show the node's own text, then its place in the tree (purpose › goal › use case), then its relations grouped by edge, each named by a phrase that reads in its own direction from the node shown: *serves* / *served by* for goals, *for goal* / *pursued by* between a use case and its goal, *includes* / *included in*, *extends* / *extended by*, *part of* / *relies on* between a requirement and its use case, *proven by* / *proves* between a node and its examples. An edge of a form the project added SHALL be named by its field. The path of nodes opened one from another SHALL be kept in the page's address, so the browser's back steps along it and a copied address opens the same node.

## Rationale

A drawer that lists `MEASURED_BY` and `USED_BY`, and puts the use case a rule belongs to under "Answered by / REFINES", makes the reader decode the schema and reverse the arrow in their head. A reviewer walking from a goal down to an example lost the way after two drawers, with no way back and no way to send someone the node they were looking at.

## Scope

The node drawer of `kotta ui`, in every view.
