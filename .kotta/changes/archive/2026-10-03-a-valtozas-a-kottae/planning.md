---
change: a-valtozas-a-kottae
generated_at: 2026-10-03T08:53:03.357Z
delta_hash: sha256:cb8600454b56d9419901ddd960baf6a18dbc67af9f5d36da9c83f81d0ce5fcc3
ready_for_approval: true
---

# Planning: a-valtozas-a-kottae

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A proposal opens as a change in the workspace (BR-135bh7fj) — business-rule, .kotta/changes/a-valtozas-a-kottae/model/business-rules/a-proposal-opens-as-a-change-in-the-workspace-135bh7fj.md
- OpenSpec is an optional narrative (BR-emp1hf25) — business-rule, .kotta/changes/a-valtozas-a-kottae/model/business-rules/openspec-is-an-optional-narrative-emp1hf25.md
- The rules name nothing an agent should not reach for (BR-zafbhr7w) — business-rule, .kotta/changes/a-valtozas-a-kottae/model/business-rules/the-rules-name-nothing-an-agent-should-not-reach-for-zafbhr7w.md
- A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/a-change-left-in-openspec-s-folder-moves-into-the-workspace-pr86pf0x.md
- A request for a spec opens a change, not a document (EX-2864xt82) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/a-request-for-a-spec-opens-a-change-not-a-document-2864xt82.md
- A workshop drafts its node into the change (EX-gj9dqmf6) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/a-workshop-drafts-its-node-into-the-change-gj9dqmf6.md
- The rules file does not name OpenSpec, not even to forbid it (EX-patt5yag) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/the-rules-file-does-not-name-openspec-not-even-to-forbid-it-patt5yag.md
- Without a narrative setting nothing is written under openspec (EX-f0xegwk8) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/without-a-narrative-setting-nothing-is-written-under-openspe-f0xegwk8.md

Changed:
- The code never runs ahead of the spec (BR-n9q6hsr2) — business-rule, .kotta/changes/a-valtozas-a-kottae/model/business-rules/say-when-the-code-runs-ahead-of-the-spec-n9q6hsr2.md
- Building an approved change needs no signal (EX-n48rz5e0) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/building-an-approved-change-needs-no-signal-n48rz5e0.md
- A promise the model does not state opens a change first (EX-rkb7tgy4) — example, .kotta/changes/a-valtozas-a-kottae/model/examples/code-ahead-of-the-model-is-named-in-one-line-rkb7tgy4.md
- Migrate a workspace (UC-qc2esx9h) — use-case, .kotta/changes/a-valtozas-a-kottae/model/use-cases/migrate-a-workspace-qc2esx9h.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Workspace (E-pcbqw35f)** — names the changed node in 'used_by' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
2. **Migration moves vocabulary, never identity (EX-4fp0gdxx)** — names the changed node in 'subjects' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
3. **Finder metadata does not stop the migration (EX-ee22m627)** — names the changed node in 'subjects' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
4. **An unknown entry still stops the migration (EX-whpsay21)** — names the changed node in 'subjects' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
5. **Work that touches no promise says nothing about the spec (EX-587hhk1d)** — names the changed node in 'subjects' (references-changed; because of The code never runs ahead of the spec (BR-n9q6hsr2)). Awaits judgement.
6. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
7. **The repository is the shared truth (G-vtd9jg9h)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
8. **The kotta CLI (IF-sdygxa04)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
9. **Operator (A-4tq0s0rg)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
10. **Calling-chat agent (A-ngzgemz8)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.

64 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *The workspace file format* still describes the workspace as a spec namespace and a service-owned process namespace; the delta's *A proposal opens as a change in the workspace* adds a third place, `.kotta/changes/`, that the format does not name. The format node is stale in other ways too (process namespace, union-merged index) and is left to its own change.
- judged: with the rule turned into a prohibition, *Building an approved change needs no signal* is changed in the delta to say the agent would otherwise open a change first; *Work that touches no promise says nothing about the spec* still holds as written, since such work stays outside the rule.
- judged: 39 accepted nodes cite sources under `openspec/changes/<name>/`, which no longer exist there after the migration; their content does not contradict the delta, but the board cannot open those citations. Not repaired here: rewriting accepted provenance is its own change.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

12 delta nodes: 1 stated, 11 partly-inferred, 0 inferred.
Decided by: 2 human, 10 agent-proposed-human-approved, 0 agent-decided.

What the machine decided alone:

- nothing

Conversation: .kotta/changes/a-valtozas-a-kottae/conversation.md, cited 24 times. Read it for the why before calling anything inferred.
- Unresolved: The code never runs ahead of the spec (BR-n9q6hsr2) cites “.kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3” — name the conversation as .kotta/changes/a-valtozas-a-kottae/conversation.md, the repository-relative path the board opens.
- Unresolved: Building an approved change needs no signal (EX-n48rz5e0) cites “.kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3” — name the conversation as .kotta/changes/a-valtozas-a-kottae/conversation.md, the repository-relative path the board opens.
