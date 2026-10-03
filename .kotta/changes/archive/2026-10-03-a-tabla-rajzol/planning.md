---
change: a-tabla-rajzol
generated_at: 2026-10-03T15:26:31.185Z
delta_hash: sha256:a0ffa4c231f8602119f4ea47e05ed302617f1b658a8e9d7e7765fa4aabd0a114
ready_for_approval: true
---

# Planning: a-tabla-rajzol

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A state machine written as one paragraph is still drawn (BR-zj7czkeq) — business-rule, .kotta/changes/a-tabla-rajzol/model/business-rules/a-state-machine-written-as-one-paragraph-is-still-drawn-zj7czkeq.md
- Every diagram can be taken away as SVG or PNG (BR-eap927vb) — business-rule, .kotta/changes/a-tabla-rajzol/model/business-rules/every-diagram-can-be-taken-away-as-svg-or-png-eap927vb.md
- The board draws its own diagrams, and Mermaid is one switch away (BR-2f1tzzsq) — business-rule, .kotta/changes/a-tabla-rajzol/model/business-rules/the-board-draws-its-own-diagrams-and-mermaid-is-one-switch-a-2f1tzzsq.md
- A diagram is copied as a picture and nothing is written (EX-7b872mpc) — example, .kotta/changes/a-tabla-rajzol/model/examples/a-diagram-is-copied-as-a-picture-and-nothing-is-written-7b872mpc.md
- The batch lifecycle is drawn from its one paragraph (EX-xxsbabhh) — example, .kotta/changes/a-tabla-rajzol/model/examples/the-batch-lifecycle-is-drawn-from-its-one-paragraph-xxsbabhh.md
- The renderer switch redraws the same diagram (EX-0wqjx5m6) — example, .kotta/changes/a-tabla-rajzol/model/examples/the-renderer-switch-redraws-the-same-diagram-0wqjx5m6.md

Changed: none

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

No accepted node shares an edge with, is named by, or contrasts with the delta.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Accessible web surfaces* asks for a board that is keyboard-usable throughout and checked by axe in the suite; in the board's own renderer a node opens on a click only (the same node opens from the list under every diagram by keyboard), and the suite runs axe on the Mermaid drawing alone, because the test environment cannot lay the drawn one out. rp, 2026-10-03, at the gate: „1a” — it ships as is, keyboard focus on the drawing comes in a later change.
- judged: *The read-only board* says the built page carried in the repository must match its source; the page is rebuilt with this change, and copying or saving a diagram happens in the browser alone, so the board still writes nothing.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

6 delta nodes: 0 stated, 5 partly-inferred, 1 inferred.
Decided by: 0 human, 2 agent-proposed-human-approved, 4 agent-decided.

What the machine decided alone:

- A state machine written as one paragraph is still drawn (BR-zj7czkeq) — What was wrong was read by the agent: the operator's state machine wrote its three transitions in one paragraph and the board drew none; one transition began at a condition, not a state. The cut at sentence ends and the condition rule are the agent's.
- A diagram is copied as a picture and nothing is written (EX-7b872mpc) — The concrete case is the agent's.
- The batch lifecycle is drawn from its one paragraph (EX-xxsbabhh) — The case is the operator's own batch lifecycle, shortened by the agent.
- The renderer switch redraws the same diagram (EX-0wqjx5m6) — The concrete case is the agent's.

Conversation: .kotta/changes/a-tabla-rajzol/conversation.md, cited 8 times. Read it for the why before calling anything inferred.
