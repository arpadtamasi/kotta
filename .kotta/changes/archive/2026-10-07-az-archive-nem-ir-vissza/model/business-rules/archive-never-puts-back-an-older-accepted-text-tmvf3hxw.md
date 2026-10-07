---
id: BR-01m4at3x2fffqepx85tmvf3hxw
form: business-rule
title: Archive never puts back an older accepted text
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/az-archive-nem-ir-vissza/conversation.md · J1"
    - ".kotta/changes/az-archive-nem-ir-vissza/conversation.md · J2"
    - "https://github.com/arpadtamasi/kotta/issues/61"
    - "chat · rp, 2026-10-07: „a” — an older approval without the fingerprint is not archived; plan and approve it again"
  quote: "rp, 2026-10-06/07: „igen” (to: the archive should stop instead of reverting) — „igen és neki is állhatsz”"
  inferred: "Recording each replaced node's accepted text at approval, and refusing at archive when it moved, is the agent's design; an older receipt without it is refused, as the operator chose (a)."
---

# Archive never puts back an older accepted text

## Rule

When a change's delta replaces an accepted node, `kotta approve` SHALL record, beside the delta's fingerprint, the fingerprint of that accepted node as it stood when the human said yes. `kotta archive` SHALL refuse to replace a node whose accepted text no longer matches what the approval recorded: it SHALL name the node, say that it changed after the approval, and write nothing. The change is then brought up to the new text — its copy taken again, its own edit applied to it — planned, and put to the human again. A node the change only adds or removes is not affected. An approval recorded before this rule, which carries no such fingerprint, SHALL NOT be archived over a node it replaces: the archive asks for the change to be planned and approved again.

## Rationale

A change copies the accepted nodes it replaces. When another change lands on one of them in between, archiving the first one wrote its stale copy back and silently undid the second, approved change; nothing measured it, and only reading the diff caught it. The human approved an edit of the text they saw, not a revert of a text they approved later.

## Scope

`kotta approve` and `kotta archive`, for every node a delta replaces.
