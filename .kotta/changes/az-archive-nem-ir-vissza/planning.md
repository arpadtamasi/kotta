---
change: az-archive-nem-ir-vissza
generated_at: 2026-10-07T09:12:16.891Z
delta_hash: sha256:2bd42fec36ad0b1a0113710f90ee16c3ce22d1521af2f410141b659d7b946d6b
ready_for_approval: false
---

# Planning: az-archive-nem-ir-vissza

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- Archive never puts back an older accepted text (BR-tmvf3hxw) — business-rule, .kotta/changes/az-archive-nem-ir-vissza/model/business-rules/archive-never-puts-back-an-older-accepted-text-tmvf3hxw.md
- A node changed after the approval stops the archive (EX-z5wvp380) — example, .kotta/changes/az-archive-nem-ir-vissza/model/examples/a-node-changed-after-the-approval-stops-the-archive-z5wvp380.md
- A node unchanged since the approval lands as before (EX-1tvxmz88) — example, .kotta/changes/az-archive-nem-ir-vissza/model/examples/a-node-unchanged-since-the-approval-lands-as-before-1tvxmz88.md

Changed:
- An approval leaves a receipt (EX-3wmn4brs) — example, .kotta/changes/az-archive-nem-ir-vissza/model/examples/an-approval-leaves-a-receipt-3wmn4brs.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Consequential transitions are human gates (BR-3y4d20a7)** — is named by the changed node (referenced-by-changed; because of An approval leaves a receipt (EX-3wmn4brs)). Awaits judgement.
2. **Proportionate ceremony (QA-r5t8pweh)** — is named by the changed node (referenced-by-changed; because of An approval leaves a receipt (EX-3wmn4brs)). Awaits judgement.
3. **Approve a gate in conversation (UC-5vg5012n)** — is named by the changed node (referenced-by-changed; because of An approval leaves a receipt (EX-3wmn4brs)). Awaits judgement.
4. **The board refuses to write (EX-y9htdeh1)** — both name Consequential transitions are human gates in 'subjects' (shares-edge; because of An approval leaves a receipt (EX-3wmn4brs)). Awaits judgement.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Consequential transitions are human gates* and *Approve a gate in conversation* say that after the yes the archive lands the approved delta without asking again. The new rule adds one more case where the yes no longer holds — the accepted text it was given against has moved — next to the existing one, the delta edited after the yes. It asks again only then; no contradiction, but the human will meet a second question in that case.
- judged: *Proportionate ceremony* and *The board refuses to write* share only edges with the receipt example; nothing in them is about what the receipt records. No contradiction.
<!-- /kotta:judged -->

## (d) Silences

- Open: Archive never puts back an older accepted text (BR-tmvf3hxw) BR-tmvf3hxw/Q1 — **Mi legyen azokkal a jóváhagyásokkal, amelyek még e szabály előtt készültek?** Egy régebbi jóváhagyás nem rögzítette, milyen szöveget cserél le a változás, így az archiválás nem tudja összevetni. (a) Az archiválás ilyenkor megáll, és új jóváhagyást kér: a változást újra kell mérni, és újra igent kell mondanod. (b) Az archiválás a Git-történetből keresi meg, mi volt az elfogadott szöveg a jóváhagyás pillanatában, és azzal veti össze. Én az (a)-t javaslom: egyszerű és biztos, és most egyetlen jóváhagyott, de nem archivált változás sincs, tehát senkit nem érint. (.kotta/changes/az-archive-nem-ir-vissza/model/business-rules/archive-never-puts-back-an-older-accepted-text-tmvf3hxw.md:33)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

4 delta nodes: 0 stated, 4 partly-inferred, 0 inferred.
Decided by: 0 human, 3 agent-proposed-human-approved, 1 agent-decided.

What the machine decided alone:

- An approval leaves a receipt (EX-3wmn4brs) — The receipt now also records the fingerprint of each node the delta replaces (BR-01m4at3x2fffqepx85tmvf3hxw); the rest is the accepted text.

Conversation: .kotta/changes/az-archive-nem-ir-vissza/conversation.md, cited 7 times. Read it for the why before calling anything inferred.
