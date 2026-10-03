---
change: az-a-team-oroksege-megy
generated_at: 2026-10-03T15:26:43.421Z
delta_hash: sha256:fd936cfebf5a8a158a5e4b0058499e3f3fe67537aec4ad0e4f806d2538faaa01
ready_for_approval: true
---

# Planning: az-a-team-oroksege-megy

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- Kotta knows one workspace name (BR-18bdnm4j) — business-rule, .kotta/changes/az-a-team-oroksege-megy/model/business-rules/kotta-knows-one-workspace-name-18bdnm4j.md
- A pre-1.0 workspace is refused and names the release that migrates it (EX-52ftgqs0) — example, .kotta/changes/az-a-team-oroksege-megy/model/examples/a-pre-1-0-workspace-is-refused-and-names-the-release-that-mi-52ftgqs0.md
- A pre-rename workspace is not found (EX-ykrshbtc) — example, .kotta/changes/az-a-team-oroksege-megy/model/examples/a-pre-rename-workspace-is-not-found-ykrshbtc.md

Changed:
- A version boundary refuses in both directions (BR-z8mc2hgg) — business-rule, .kotta/changes/az-a-team-oroksege-megy/model/business-rules/a-version-boundary-refuses-in-both-directions-mc2hgg.md
- The rules name nothing an agent should not reach for (BR-zafbhr7w) — business-rule, .kotta/changes/az-a-team-oroksege-megy/model/business-rules/the-rules-name-nothing-an-agent-should-not-reach-for-zafbhr7w.md
- A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x) — example, .kotta/changes/az-a-team-oroksege-megy/model/examples/a-change-left-in-openspec-s-folder-moves-into-the-workspace-pr86pf0x.md
- The kotta CLI (IF-sdygxa04) — interface, .kotta/changes/az-a-team-oroksege-megy/model/interfaces/cli-sdygxa04.md
- The workspace file format (IF-a7xqgvx6) — interface, .kotta/changes/az-a-team-oroksege-megy/model/interfaces/workspace-format-a7xqgvx6.md
- Migrate a workspace (UC-qc2esx9h) — use-case, .kotta/changes/az-a-team-oroksege-megy/model/use-cases/migrate-a-workspace-qc2esx9h.md

Removed:
- Migration skips operating-system metadata and nothing else (BR-babstw2c) — business-rule, .kotta/spec/business-rules/migration-skips-operating-system-metadata-and-nothing-else-babstw2c.md
- Finder metadata does not stop the migration (EX-ee22m627) — example, .kotta/spec/examples/finder-metadata-does-not-stop-the-migration-ee22m627.md
- An unknown entry still stops the migration (EX-whpsay21) — example, .kotta/spec/examples/an-unknown-entry-still-stops-the-migration-whpsay21.md
- Migration moves vocabulary, never identity (EX-4fp0gdxx) — example, .kotta/spec/examples/migration-moves-vocabulary-never-identity-4fp0gdxx.md

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Task (E-13zjx3ye)** — names the changed node in 'interfaces' (references-changed; because of The workspace file format (IF-a7xqgvx6)). Awaits judgement.
2. **Workspace (E-pcbqw35f)** — names the changed node in 'interfaces' (references-changed; because of The workspace file format (IF-a7xqgvx6)). Awaits judgement.
3. **Workspace (E-pcbqw35f)** — names the changed node in 'used_by' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
4. **A newer workspace is refused, not downgraded (EX-j8tr5zjp)** — names the changed node in 'subjects' (references-changed; because of A version boundary refuses in both directions (BR-z8mc2hgg)). Awaits judgement.
5. **The rules file does not name OpenSpec, not even to forbid it (EX-patt5yag)** — names the changed node in 'subjects' (references-changed; because of The rules name nothing an agent should not reach for (BR-zafbhr7w)). Awaits judgement.
6. **Orient in the workspace (UC-8e5c9p6p)** — names the changed node in 'interfaces' (references-changed; because of The kotta CLI (IF-sdygxa04)). Awaits judgement.
7. **Define a task (UC-a7zw45xr)** — names the changed node in 'interfaces' (references-changed; because of The kotta CLI (IF-sdygxa04)). Awaits judgement.
8. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
9. **Identifiers are permanent (BR-5yn1nw85)** — is named by the changed node (referenced-by-changed; because of A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x)). Awaits judgement.
10. **A proposal opens as a change in the workspace (BR-135bh7fj)** — is named by the changed node (referenced-by-changed; because of A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x)). Awaits judgement.

165 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *The kotta CLI* said a pre-migration workspace is refused naming `migrate`; with this change it names the last release that migrates it. Changed in the delta. Its list of commands still names the task, observation, batch, decision and claim families, which the approved *a-motor-maradek-igeretei* takes out; left to that change.
- judged: *Kotta owns its rules file, never the project's* says `kotta migrate` refreshes the rules file "as it carries a workspace forward"; the migration that is left only moves changes and does not touch the rules file. The rule still holds for `init` and `sync`; the `migrate` clause becomes empty.
- judged: *Workspace* says identifiers never change across migrations; still true of the migration that is left, which *A change left in OpenSpec's folder moves into the workspace* now proves.
- judged: the remaining candidates share only an edge or the 2026-08-24 admission text with the changed nodes. No contradiction.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

9 delta nodes: 2 stated, 7 partly-inferred, 0 inferred.
Decided by: 7 human, 2 agent-proposed-human-approved, 0 agent-decided.

What the machine decided alone:

- nothing

Conversation: .kotta/changes/az-a-team-oroksege-megy/conversation.md, cited 21 times. Read it for the why before calling anything inferred.
- Unresolved: The rules name nothing an agent should not reach for (BR-zafbhr7w) cites “.kotta/changes/a-valtozas-a-kottae/conversation.md · SZ2” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: The rules name nothing an agent should not reach for (BR-zafbhr7w) cites “.kotta/changes/a-valtozas-a-kottae/conversation.md · P3” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: The rules name nothing an agent should not reach for (BR-zafbhr7w) cites “.kotta/changes/a-valtozas-a-kottae/conversation.md · P4” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x) cites “.kotta/changes/a-valtozas-a-kottae/conversation.md · J2” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: A change left in OpenSpec's folder moves into the workspace (EX-pr86pf0x) cites “.kotta/changes/a-valtozas-a-kottae/conversation.md · J4” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: Migrate a workspace (UC-qc2esx9h) cites “.kotta/changes/archive/2026-10-03-a-valtozas-a-kottae/conversation.md · J4” — name the conversation as .kotta/changes/az-a-team-oroksege-megy/conversation.md, the repository-relative path the board opens.
