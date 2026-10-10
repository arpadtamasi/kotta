---
id: BR-01m4gg8w19p98hafy5m1q4g452
form: business-rule
title: "The tree names the gaps in its structure"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/spec-hierarchiaja/conversation.md · SZ3"
    - "chat · rp, 2026-10-09 13:5x, answer to a structured question: „Séma + board együtt” (the goal form gets a goal-serves-goal edge, the use cases an order, the board builds on them) and „Mind az öt” (all five board findings)"
  quote: "rp, 2026-10-09: „kb úgy is, hogy a fenti leírást le tudják-e követni rajta, és ha igen, miért nem”"
  inferred: "Which gaps are named, and that each says what to add and that it goes into a change, are the agent's, revised after both critics found the first version measured the wrong thing."
---
# The tree names the gaps in its structure

## Rule

The tree's header SHALL show how many gaps the model's structure has, and SHALL name each: an actor with more than one `user-goal` use case and no summary use case that includes any of them; a `user-goal` use case off every journey whose goal a journey step serves; a goal that no use case serves; and several goals that serve no other goal. A use case with no `level` counts as `user-goal` throughout. Each gap SHALL lead to the nodes it names and SHALL say what would close it and that it is closed in a change. With no gap the header SHALL say so in words; while a gap exists, nothing on the board SHALL state the structure complete.

## Rationale

A flat model looks tidy: the intimity tree said "No place yet: 0" while its eight goals had no common purpose and its journey was nowhere — the reviewer saw health where the structure was missing. What the board cannot show it has to say, and since the board only reads, it has to say where the fix goes.

## Scope

The tree view of `kotta ui`, on the accepted specification and on an opened change.
