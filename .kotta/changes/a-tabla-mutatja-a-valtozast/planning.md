---
change: a-tabla-mutatja-a-valtozast
generated_at: 2026-10-03T08:31:07.099Z
delta_hash: sha256:32d4ae52547569eb9611685d03f69ccb33cd81e42ed514b4009a694fc6d7de3f
ready_for_approval: false
---

# Planning: a-tabla-mutatja-a-valtozast

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- The board shows what waits at the gate (BR-51hr9e3d) — business-rule, .kotta/changes/a-tabla-mutatja-a-valtozast/model/business-rules/the-board-shows-what-waits-at-the-gate-51hr9e3d.md
- A changed node is marked against the accepted one (EX-vrp7zcfh) — example, .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/a-changed-node-is-marked-against-the-accepted-one-vrp7zcfh.md
- An uncommitted change appears on the board (EX-e1g3vw2b) — example, .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/an-uncommitted-change-appears-on-the-board-e1g3vw2b.md
- The accepted view is unchanged by an open change (EX-qvez2bpz) — example, .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/the-accepted-view-is-unchanged-by-an-open-change-qvez2bpz.md

Changed:
- The read-only board (IF-kh6t6tnw) — interface, .kotta/changes/a-tabla-mutatja-a-valtozast/model/interfaces/board-kh6t6tnw.md

Removed: none

## (a) Structure of the delta

- `SPEC_NODE_WRONG_TARGET` a-changed-node-is-marked-against-the-accepted-one-vrp7zcfh.md (example) edge 'subjects' field 'subjects' references 'IF-01m0f0wn898ggsdxa0kh6t6tnw', which is a interface; point 'subjects' at user-story or use-case or business-rule or quality-attribute. — .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/a-changed-node-is-marked-against-the-accepted-one-vrp7zcfh.md
- `SPEC_NODE_WRONG_TARGET` an-uncommitted-change-appears-on-the-board-e1g3vw2b.md (example) edge 'subjects' field 'subjects' references 'IF-01m0f0wn898ggsdxa0kh6t6tnw', which is a interface; point 'subjects' at user-story or use-case or business-rule or quality-attribute. — .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/an-uncommitted-change-appears-on-the-board-e1g3vw2b.md
- `SPEC_NODE_WRONG_TARGET` the-accepted-view-is-unchanged-by-an-open-change-qvez2bpz.md (example) edge 'subjects' field 'subjects' references 'IF-01m0f0wn898ggsdxa0kh6t6tnw', which is a interface; point 'subjects' at user-story or use-case or business-rule or quality-attribute. — .kotta/changes/a-tabla-mutatja-a-valtozast/model/examples/the-accepted-view-is-unchanged-by-an-open-change-qvez2bpz.md

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Orient in the workspace (UC-8e5c9p6p)** — names the changed node in 'interfaces' (references-changed; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
2. **Operator (A-4tq0s0rg)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
3. **Calling-chat agent (A-ngzgemz8)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
4. **Executing agent (A-xv5xrv38)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
5. **Decision (E-kab1g2f7)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
6. **Task (E-13zjx3ye)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
7. **Observation (E-wtmpk4fr)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
8. **Claim (E-4smevpvf)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
9. **Batch (E-11pkartq)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.
10. **Workspace (E-pcbqw35f)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of The read-only board (IF-kh6t6tnw)). Awaits judgement.

43 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *The read-only board* promises that state "derives from named refs through Git plumbing, never from the working-tree HEAD", and *Orient in the workspace* says the same of every read. Reading an uncommitted change from the working tree, option (a) of the open decision, breaks that promise unless the invariant names the exception; option (b) keeps it, and leaves an uncommitted change invisible.
- judged: candidates 2–10 share only the "structural: Assigned on 2026-08-24…" admission text with the board; none of them states anything about what the board shows. No contradiction.
- judged: *The read-only board* still describes tasks, observations, batches and timelines, which 1.0 removed; the added sentence does not depend on them, and repairing the rest is its own change.
<!-- /kotta:judged -->

## (d) Silences

- Open: The board shows what waits at the gate (BR-51hr9e3d) BR-51hr9e3d/Q1 — **Honnan olvassa a board a nyitott változást?** A board ma szigorúan a Gitből olvas: csak azt mutatja, ami a fő ágon commitolva van, a munkakönyvtárat soha — ez egy elfogadott ígérete. Egy készülő változás viszont jellemzően még nincs commitolva; a két wing-projektben egyetlen commit sincs. (a) A nyitott változást a munkakönyvtárból olvassa, jól láthatóan „nincs commitolva” jelöléssel; az elfogadott nézet marad a Gitből. Ehhez a board ígéretét ki kell egészíteni ezzel az egy kivétellel. (b) Csak commitolt változást mutat (bármelyik ágon); amíg nincs commit, a board azt írja ki, hogy a változás létezik, de még nincs commitolva. Én az (a)-t javaslom: a kapunál a még nem commitolt javaslatot is látni kell, különben a board épp ott hallgat, ahol kellene. (.kotta/changes/a-tabla-mutatja-a-valtozast/model/business-rules/the-board-shows-what-waits-at-the-gate-51hr9e3d.md:31)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

5 delta nodes: 0 stated, 5 partly-inferred, 0 inferred.
Decided by: 0 human, 0 agent-proposed-human-approved, 5 agent-decided.

What the machine decided alone:

- The board shows what waits at the gate (BR-51hr9e3d) — The operator reported that the board shows no change. What it should show — a selector, the merged model with marks, the proposal and its state — is the agent's design, not yet approved.
- A changed node is marked against the accepted one (EX-vrp7zcfh) — The case is the agent's illustration of the rule it proposes.
- An uncommitted change appears on the board (EX-e1g3vw2b) — The case is the agent's illustration of the rule it proposes.
- The accepted view is unchanged by an open change (EX-qvez2bpz) — The case is the agent's illustration of the rule it proposes.
- The read-only board (IF-kh6t6tnw) — Only the added postcondition sentence is new; it is the agent's design and waits for the gate. The rest of the node is the accepted text, unchanged.

Conversation: .kotta/changes/a-tabla-mutatja-a-valtozast/conversation.md, cited 5 times. Read it for the why before calling anything inferred.
