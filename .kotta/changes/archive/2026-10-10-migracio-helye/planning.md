---
change: migracio-helye
generated_at: 2026-10-10T17:34:04.134Z
delta_hash: sha256:b0eb3799116706325b258bb16f787d6d5ee5775c8ac352837af3637fc2cca52a
ready_for_approval: true
---

# Planning: migracio-helye

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added: none

Changed:
- Archive a built change (UC-9kz6vbrx) — use-case, .kotta/changes/migracio-helye/model/use-cases/archive-a-built-change-9kz6vbrx.md
- Build what was approved (UC-9km5j1db) — use-case, .kotta/changes/migracio-helye/model/use-cases/build-what-was-approved-9km5j1db.md
- Migrate a workspace (UC-qc2esx9h) — use-case, .kotta/changes/migracio-helye/model/use-cases/migrate-a-workspace-qc2esx9h.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Workspace (E-pcbqw35f)** — names the changed node in 'used_by' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
2. **Archive refuses a change with an unaccounted promise (EX-rdab0wn9)** — names the changed node in 'subjects' (references-changed; because of Archive a built change (UC-9kz6vbrx)). Awaits judgement.
3. **Building an approved change needs no signal (EX-n48rz5e0)** — names the changed node in 'subjects' (references-changed; because of Build what was approved (UC-9km5j1db)). Awaits judgement.
4. **A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x)** — names the changed node in 'subjects' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
5. **Agree before building, then see it kept (UC-4drj2vss)** — names the changed node in 'includes' (references-changed; because of Build what was approved (UC-9km5j1db)). Awaits judgement.
6. **Agree before building, then see it kept (UC-4drj2vss)** — names the changed node in 'includes' (references-changed; because of Archive a built change (UC-9kz6vbrx)). Awaits judgement.
7. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
8. **Calling-chat agent (A-ngzgemz8)** — is named by the changed node (referenced-by-changed; because of Build what was approved (UC-9km5j1db)). Awaits judgement.
9. **Calling-chat agent (A-ngzgemz8)** — is named by the changed node (referenced-by-changed; because of Archive a built change (UC-9kz6vbrx)). Awaits judgement.
10. **Every accepted promise is kept or admitted (BR-51zm9svr)** — is named by the changed node (referenced-by-changed; because of Build what was approved (UC-9km5j1db)). Awaits judgement.

43 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: the 53 candidates are references to the three use cases whose goal edge changes — entities that use them, examples that prove them, the goals and actor they name. Read: none says anything the change contradicts; the use cases' texts are unchanged.
- judged: *Agree before building, then see it kept* still includes the build and archive steps; only the goals they serve change, so the journey and its goal order stand. With the change applied `kotta validate` names no gap.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

3 delta nodes: 0 stated, 3 partly-inferred, 0 inferred.
Decided by: 1 human, 2 agent-proposed-human-approved, 0 agent-decided.

What the machine decided alone:

- nothing

Conversation: .kotta/changes/migracio-helye/conversation.md, cited 6 times. Read it for the why before calling anything inferred.
