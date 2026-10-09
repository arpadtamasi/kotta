---
change: bejarhato-hierarchia
generated_at: 2026-10-09T15:35:52.205Z
delta_hash: sha256:fb2da928deb69de9a7620a3f2a048172e8b71457f678d5df69ac08ea311d66f9
ready_for_approval: true
---

# Planning: bejarhato-hierarchia

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A broken reference and an unreadable change are said, with what to do (BR-3ahtskx0) — business-rule, .kotta/changes/bejarhato-hierarchia/model/business-rules/a-broken-reference-and-an-unreadable-change-are-said-with-wh-3ahtskx0.md
- A citation of an archived change still opens (BR-660yjaeq) — business-rule, .kotta/changes/bejarhato-hierarchia/model/business-rules/a-citation-of-an-archived-change-still-opens-660yjaeq.md
- A use case's requirements stand in the order it names them (BR-t217yr9t) — business-rule, .kotta/changes/bejarhato-hierarchia/model/business-rules/a-use-case-s-requirements-stand-in-the-order-it-names-them-t217yr9t.md
- The drawer opens a node at its top (BR-h8hjz3g3) — business-rule, .kotta/changes/bejarhato-hierarchia/model/business-rules/the-drawer-opens-a-node-at-its-top-h8hjz3g3.md
- A change with an unreadable node says so (EX-e60apv59) — example, .kotta/changes/bejarhato-hierarchia/model/examples/a-change-with-an-unreadable-node-says-so-e60apv59.md
- A dangling refines says what to do (EX-fy197s0f) — example, .kotta/changes/bejarhato-hierarchia/model/examples/a-dangling-refines-says-what-to-do-fy197s0f.md
- A rule is three moves from anywhere (EX-ztk2jysn) — example, .kotta/changes/bejarhato-hierarchia/model/examples/a-rule-is-three-moves-from-anywhere-ztk2jysn.md
- A simulated drop opens the goals it touches (EX-gxy4hsnb) — example, .kotta/changes/bejarhato-hierarchia/model/examples/a-simulated-drop-opens-the-goals-it-touches-gxy4hsnb.md
- A source in an archived change opens (EX-5r743t0b) — example, .kotta/changes/bejarhato-hierarchia/model/examples/a-source-in-an-archived-change-opens-5r743t0b.md
- Any intimity goal is two moves from the top (EX-5c34eh2c) — example, .kotta/changes/bejarhato-hierarchia/model/examples/any-intimity-goal-is-two-moves-from-the-top-5c34eh2c.md
- Stepping to the goal shows its title (EX-j8aq0701) — example, .kotta/changes/bejarhato-hierarchia/model/examples/stepping-to-the-goal-shows-its-title-j8aq0701.md
- The deal's rules stand in the order the deal names them (EX-2aff9evc) — example, .kotta/changes/bejarhato-hierarchia/model/examples/the-deal-s-rules-stand-in-the-order-the-deal-names-them-2aff9evc.md
- The outline lists goals nested by serves (EX-cg4qtn4s) — example, .kotta/changes/bejarhato-hierarchia/model/examples/the-outline-lists-goals-nested-by-serves-cg4qtn4s.md
- The hierarchy can be found around in (QA-3515ccvd) — quality-attribute, .kotta/changes/bejarhato-hierarchia/model/quality-attributes/the-hierarchy-can-be-found-around-in-3515ccvd.md

Changed: none

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

No accepted node shares an edge with, is named by, or contrasts with the delta.

The proposal's What changes names no node in these items. Is each a promise — a quality attribute, a rule — that needs a node, or work that keeps no promise? Awaits judgement:

- proposal.md:24 — Kilenc példa: hét az intimity boardján (kettő olyan szerkezettel, amilyen az intimitynek még

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: the proposal item about the nine examples names them as a group; each is a node of the delta. Work that keeps no promise of its own.
- judged: *The view holds still* (approved in spec-hierarchiaja) has a view the reader returns to open where it was left, and *The board names a relation in words* makes stepping back the browser's back. *The drawer opens a node at its top* now says the same for stepping back; only opening forward goes to the top.
- judged: *The tree names the gaps in its structure* (approved in spec-hierarchiaja) requires the header to name each gap, lead to its nodes and say what closes it. Closed, the gaps take two lines; opened, they say all of it. No conflict.
- judged: *The board reads calmly* (approved in spec-hierarchiaja) caps the fixed part of the page at 120 pixels. The outline, the closed gaps and the drop control sit in the page's flow, so they do not count toward it.
- judged: *Dropping a use case shows what falls out with it* (accepted) says what falls out; the order rule adds in which order it is listed, on the board and by `kotta spec impact`.
- judged: *The board shows the specification as a tree* (approved in the open change spec-hierarchiaja) puts the overall requirements at the top and makes a use case selectable as dropped. *The hierarchy can be found around in* keeps both: the overall requirements stay at the top, closed with their count, and the drop is chosen from one control at the top instead of a button per row. No contradiction; the tree rule says where, this says how it opens.
- judged: *The tree with the drop highlight* has the human mark a use case as dropped; with one control at the top the act is the same, and the example still holds.
- judged: *A use case refines the requirements it relies on* names the `refines` list; it says nothing of its order, so reading the order as meant adds and contradicts nothing.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

14 delta nodes: 0 stated, 14 partly-inferred, 0 inferred.
Decided by: 0 human, 1 agent-proposed-human-approved, 13 agent-decided.

What the machine decided alone:

- A broken reference and an unreadable change are said, with what to do (BR-3ahtskx0) — The operator asked that error states be checked; the post-build check found both failing. The remedy and its wording are the agent's.
- A citation of an archived change still opens (BR-660yjaeq) — The design critic found archived citations failing with ‘No such file’. The operator agreed the finding goes into this change; the remedy is the agent's.
- A use case's requirements stand in the order it names them (BR-t217yr9t) — The design critic found requirements sorted A to Z, out of the story's order. That the order a use case gives its `refines` list is the order to show is the agent's choice.
- The drawer opens a node at its top (BR-h8hjz3g3) — The design critic found that a node opened from another lands mid-text. The operator agreed the finding goes into this change; the remedy is the agent's.
- A change with an unreadable node says so (EX-e60apv59) — An illustrative case, not intimity's: the post-build check built it in a scratch workspace on 2026-10-09; the wording is the agent's.
- A dangling refines says what to do (EX-fy197s0f) — An illustrative case, not intimity's: the post-build check built it in a scratch workspace on 2026-10-09; the wording is the agent's.
- A rule is three moves from anywhere (EX-ztk2jysn) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- A simulated drop opens the goals it touches (EX-gxy4hsnb) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- A source in an archived change opens (EX-5r743t0b) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- Any intimity goal is two moves from the top (EX-5c34eh2c) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- Stepping to the goal shows its title (EX-j8aq0701) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- The deal's rules stand in the order the deal names them (EX-2aff9evc) — The case is the intimity board as reviewed on 2026-10-09; the wording is the agent's.
- The outline lists goals nested by serves (EX-cg4qtn4s) — An illustrative case on the intimity board with goals nested by serves, which intimity does not have yet; the wording is the agent's.

Conversation: .kotta/changes/bejarhato-hierarchia/conversation.md, cited 1 time. Read it for the why before calling anything inferred.
