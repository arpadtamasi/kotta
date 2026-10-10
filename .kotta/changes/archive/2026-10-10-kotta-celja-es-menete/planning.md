---
change: kotta-celja-es-menete
generated_at: 2026-10-10T16:59:01.430Z
delta_hash: sha256:21f21edcfa7aa64bbadd1e538702023203b399313300a1b98488d9c5f875d7c2
ready_for_approval: true
---

# Planning: kotta-celja-es-menete

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- An intent becomes kept code through one gate (EX-rhcj756g) — example, .kotta/changes/kotta-celja-es-menete/model/examples/an-intent-becomes-kept-code-through-one-gate-rhcj756g.md
- The human sees in time what the machine does (G-djba5sct) — goal, .kotta/changes/kotta-celja-es-menete/model/goals/the-human-sees-in-time-what-the-machine-does-djba5sct.md
- Agree before building, then see it kept (UC-4drj2vss) — use-case, .kotta/changes/kotta-celja-es-menete/model/use-cases/agree-before-building-then-see-it-kept-4drj2vss.md
- Archive a built change (UC-9kz6vbrx) — use-case, .kotta/changes/kotta-celja-es-menete/model/use-cases/archive-a-built-change-9kz6vbrx.md
- Build what was approved (UC-9km5j1db) — use-case, .kotta/changes/kotta-celja-es-menete/model/use-cases/build-what-was-approved-9km5j1db.md

Changed:
- Archive refuses a change with an unaccounted promise (EX-rdab0wn9) — example, .kotta/changes/kotta-celja-es-menete/model/examples/archive-refuses-a-change-with-an-unaccounted-promise-rdab0wn9.md
- Building an approved change needs no signal (EX-n48rz5e0) — example, .kotta/changes/kotta-celja-es-menete/model/examples/building-an-approved-change-needs-no-signal-n48rz5e0.md
- Completion is evidence, not report (G-a019v5x2) — goal, .kotta/changes/kotta-celja-es-menete/model/goals/completion-is-evidence-not-report-a019v5x2.md
- Direct more work than you can observe (G-c57sdzez) — goal, .kotta/changes/kotta-celja-es-menete/model/goals/direct-more-work-than-you-can-observe-c57sdzez.md
- The repository is the shared truth (G-vtd9jg9h) — goal, .kotta/changes/kotta-celja-es-menete/model/goals/the-repository-is-the-shared-truth-vtd9jg9h.md

Removed:
- The ceremony fits the stakes (G-k5psy35m) — goal, .kotta/spec/goals/the-ceremony-fits-the-stakes-k5psy35m.md

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Orient in the workspace (UC-8e5c9p6p)** — names the changed node in 'goal' (references-changed; because of The repository is the shared truth (G-vtd9jg9h)). Awaits judgement.
2. **Shape the specification (UC-ke3ksnra)** — names the changed node in 'goal' (references-changed; because of Direct more work than you can observe (G-c57sdzez)). Awaits judgement.
3. **Approve a gate in conversation (UC-5vg5012n)** — names the changed node in 'goal' (references-changed; because of Direct more work than you can observe (G-c57sdzez)). Awaits judgement.
4. **Migrate a workspace (UC-qc2esx9h)** — names the changed node in 'goal' (references-changed; because of The repository is the shared truth (G-vtd9jg9h)). Awaits judgement.
5. **Analyze the implementation gap (UC-0v1ag64q)** — names the changed node in 'goal' (references-changed; because of Direct more work than you can observe (G-c57sdzez)). Awaits judgement.
6. **The spec is the agreement (BR-84jsrqbe)** — is named by the changed node (referenced-by-changed; because of Building an approved change needs no signal (EX-n48rz5e0)). Awaits judgement.
7. **The code never runs ahead of the spec (BR-n9q6hsr2)** — is named by the changed node (referenced-by-changed; because of Building an approved change needs no signal (EX-n48rz5e0)). Awaits judgement.
8. **A change is built before it is archived (BR-97dmry35)** — is named by the changed node (referenced-by-changed; because of Archive refuses a change with an unaccounted promise (EX-rdab0wn9)). Awaits judgement.
9. **The board survives a restart (EX-7rbytqjh)** — is named by the changed node (referenced-by-changed; because of Direct more work than you can observe (G-c57sdzez)). Awaits judgement.
10. **The board survives a restart (EX-7rbytqjh)** — is named by the changed node (referenced-by-changed; because of The repository is the shared truth (G-vtd9jg9h)). Awaits judgement.

68 lower-ranked candidates are not listed; the 10 above rank highest.

The proposal's What changes names no node in these items. Is each a promise — a quality attribute, a rule — that needs a node, or work that keeps no promise? Awaits judgement:

- proposal.md:21 — A cél és a használati eset forma a Kotta által szállított változatra frissül (`serves`,
- proposal.md:32 — Egy új példa, és két meglévő, amely az új használati eseteket is igazolja.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: the 78 candidates come from three edges the change adds — goals now serving the purpose, two examples now also proving the new build and archive use cases, and the forms updated to the shipped ones. Read: none states anything the change contradicts; every goal's text is unchanged.
- judged: *Proportionate ceremony* already measured *The ceremony fits the stakes*; with the goal removed it carries the same promise as the quality it is. Nothing else names the removed goal.
- judged: the updated use-case form adds `includes`, `extends`, `refines` and `level` as optional edges and a field; Kotta's own use cases carry none of them yet, so no accepted node changes meaning.
- judged: the proposal items about the forms and the example name no node because a form is not a node and the example is named by what it does; both are in the delta.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

10 delta nodes: 0 stated, 10 partly-inferred, 0 inferred.
Decided by: 0 human, 5 agent-proposed-human-approved, 5 agent-decided.

What the machine decided alone:

- An intent becomes kept code through one gate (EX-rhcj756g) — The case is the work of 2026-10-09 on the board's hierarchy, told as the journey.
- Completion is evidence, not report (G-a019v5x2) — 2026-10-10 (kotta-celja-es-menete): serves the purpose the operator's observation names; the edge is the agent's. Restated from review evidence and execution outcomes, which are removed, to evidence by citation, which the release keeps. Context is unchanged. It is now measured by *An unadmitted promise fails the gap check*.
- Direct more work than you can observe (G-c57sdzez) — The goal's text is as accepted, before Kotta recorded provenance; 2026-10-10 (kotta-celja-es-menete) adds only that it serves the purpose, the agent's edge.
- The repository is the shared truth (G-vtd9jg9h) — The goal's text is as accepted, before Kotta recorded provenance; 2026-10-10 (kotta-celja-es-menete) adds only that it serves the purpose, the agent's edge.
- Agree before building, then see it kept (UC-4drj2vss) — The steps and their order follow the rules file's own path from chat to code; naming them as one journey is the agent's; that building and archiving are steps of their own is the operator's answer (K2).

Conversation: .kotta/changes/kotta-celja-es-menete/conversation.md, cited 13 times. Read it for the why before calling anything inferred.
