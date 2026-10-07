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
  quote: "rp, 2026-10-06/07: „igen” (to: the archive should stop instead of reverting) — „igen és neki is állhatsz”"
  inferred: "Recording each replaced node's accepted text at approval, and refusing at archive when it moved, is the agent's design; what an older receipt without it gets is open below."
---

# Archive never puts back an older accepted text

## Rule

When a change's delta replaces an accepted node, `kotta approve` SHALL record, beside the delta's fingerprint, the fingerprint of that accepted node as it stood when the human said yes. `kotta archive` SHALL refuse to replace a node whose accepted text no longer matches what the approval recorded: it SHALL name the node, say that it changed after the approval, and write nothing. The change is then brought up to the new text — its copy taken again, its own edit applied to it — planned, and put to the human again. A node the change only adds or removes is not affected.

## Rationale

A change copies the accepted nodes it replaces. When another change lands on one of them in between, archiving the first one wrote its stale copy back and silently undid the second, approved change; nothing measured it, and only reading the diff caught it. The human approved an edit of the text they saw, not a revert of a text they approved later.

## Scope

`kotta approve` and `kotta archive`, for every node a delta replaces.

## Open decisions

- **Mi legyen azokkal a jóváhagyásokkal, amelyek még e szabály előtt készültek?** Egy régebbi jóváhagyás nem rögzítette, milyen szöveget cserél le a változás, így az archiválás nem tudja összevetni. (a) Az archiválás ilyenkor megáll, és új jóváhagyást kér: a változást újra kell mérni, és újra igent kell mondanod. (b) Az archiválás a Git-történetből keresi meg, mi volt az elfogadott szöveg a jóváhagyás pillanatában, és azzal veti össze. Én az (a)-t javaslom: egyszerű és biztos, és most egyetlen jóváhagyott, de nem archivált változás sincs, tehát senkit nem érint.
