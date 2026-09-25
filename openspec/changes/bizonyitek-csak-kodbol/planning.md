---
change: bizonyitek-csak-kodbol
generated_at: 2026-09-25T16:57:51.686Z
delta_hash: sha256:0532a6e53486afbd31bee6c34453cff18e70b9aeea33ad3b523efcc51c869ad3
ready_for_approval: false
---

# Planning: bizonyitek-csak-kodbol

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A copy of the specification is not evidence (BR-ky1kcx0n) — business-rule, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/a-copy-of-the-specification-is-not-evidence-ky1kcx0n.md
- Migration skips operating-system metadata and nothing else (BR-babstw2c) — business-rule, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/migration-skips-operating-system-metadata-and-nothing-else-babstw2c.md
- The import drafts nothing from a comment (BR-6d5ch9e6) — business-rule, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-import-drafts-nothing-from-a-comment-6d5ch9e6.md
- The report names what it did not count (BR-y0565652) — business-rule, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md
- A comment-only Purpose drafts no goal (EX-760f1n2b) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-comment-only-purpose-drafts-no-goal-760f1n2b.md
- A generated binding is neither cited nor a test (EX-40kqm294) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-generated-binding-is-neither-cited-nor-a-test-40kqm294.md
- A node named only in an excluded source says which (EX-jpvk80dx) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-node-named-only-in-an-excluded-source-says-which-jpvk80dx.md
- A node named only in the specification belongs to no module (EX-34zfdx6p) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-node-named-only-in-the-specification-belongs-to-no-module-34zfdx6p.md
- A project's own specs directory still holds tests (EX-nbfdzwzz) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-project-s-own-specs-directory-still-holds-tests-nbfdzwzz.md
- A Purpose with prose drafts from the prose alone (EX-wcrazx8g) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-purpose-with-prose-drafts-from-the-prose-alone-wcrazx8g.md
- An archived change cites nothing (EX-1jcf80np) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/an-archived-change-cites-nothing-1jcf80np.md
- An unknown entry still stops the migration (EX-whpsay21) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/an-unknown-entry-still-stops-the-migration-whpsay21.md
- Finder metadata does not stop the migration (EX-ee22m627) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/finder-metadata-does-not-stop-the-migration-ee22m627.md

Changed:
- Every accepted promise is kept or admitted (BR-51zm9svr) — business-rule, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/every-accepted-promise-is-kept-or-admitted-zm9svr.md
- Analyze the implementation gap (UC-0v1ag64q) — use-case, openspec/changes/bizonyitek-csak-kodbol/model/use-cases/analyze-the-implementation-gap-0v1ag64q.md
- Migrate a workspace (UC-qc2esx9h) — use-case, openspec/changes/bizonyitek-csak-kodbol/model/use-cases/migrate-a-workspace-qc2esx9h.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Workspace (E-pcbqw35f)** — names the changed node in 'used_by' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
2. **Migration moves vocabulary, never identity (EX-4fp0gdxx)** — names the changed node in 'subjects' (references-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
3. **The gap report names the unimplemented promise (EX-jdk7rtk6)** — names the changed node in 'subjects' (references-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
4. **An unadmitted promise fails the gap check (EX-zhfg56b2)** — names the changed node in 'subjects' (references-changed; because of Every accepted promise is kept or admitted (BR-51zm9svr)). Awaits judgement.
5. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
6. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
7. **Direct more work than you can observe (G-c57sdzez)** — is named by the changed node (referenced-by-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
8. **The repository is the shared truth (G-vtd9jg9h)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
9. **The kotta CLI (IF-sdygxa04)** — is named by the changed node (referenced-by-changed; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.
10. **Operator (A-4tq0s0rg)** — both name structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here. in 'accepted' (shares-edge; because of Migrate a workspace (UC-qc2esx9h)). Awaits judgement.

127 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Analyze the implementation gap* (accepted Alternatives, unchanged) names uncommitted paths that "could carry the missing evidence"; under *A copy of the specification is not evidence* an uncommitted path under `openspec/` can never carry it. Measured today on this branch: `kotta gap` names `openspec/changes/bizonyitek-csak-kodbol/planning.md` and the change's `specs/*.md` as possible evidence. Does the uncommitted-path hint go through the same filter? The delta does not say.
- judged: *Every accepted promise is kept or admitted* refuses (non-zero exit) every node that is neither evidenced nor admitted, softened only for "work that has not begun". The proposal expects 184 → 0 cited on the measured project, where the code names no id: after this change its `kotta gap` refuses 184 nodes unless each is admitted. Is that the intended consequence, or does "the work has not begun" cover them? The delta states neither.
- judged: *Shape the specification* calls a specification id written into a node's text "a citation" and speaks of "the same analysis that treats a cited id as evidence"; the delta says the specification and every copy of it is never evidence. The nodes themselves were already excluded (`.kotta/`), so no behaviour conflicts, but "citation" now means two things — a reference between nodes and evidence in code. Keep the word, or reword the use case?
- judged: the narrative requirement *Minden elfogadott ígéretről látszik, megépült-e* (bound to *Every accepted promise is kept or admitted*) also demands that the report tell module-level from test-level binding; no accepted node and no delta node states that. Drift reads zero only because the node's provenance quote matches the evidence sentence. The sentence comes from the unarchived 1.0 change's narrative, not from this change.
- judged: *Migration skips operating-system metadata and nothing else* keeps the ignored file out of the archive; the unarchived 1.0 migration narrative says of the migration "semmi nem törlődik" (nothing is deleted). If the old directory is removed with its `.DS_Store` in it, the two disagree — this is the rule's open question on what happens to an ignored file on disk.
<!-- /kotta:judged -->

## (d) Silences

- Open: A copy of the specification is not evidence (BR-ky1kcx0n) BR-ky1kcx0n/Q1 — Is `openspec/` excluded only at the repository root, as the design names it, or also where a package of a monorepo keeps its own `openspec/` tree — which would otherwise still count as evidence under this rule's own principle? (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/a-copy-of-the-specification-is-not-evidence-ky1kcx0n.md:30)
- Open: Migration skips operating-system metadata and nothing else (BR-babstw2c) BR-babstw2c/Q1 — Is the list exactly `.DS_Store`, `Thumbs.db` and `desktop.ini`, or does it also take other operating-system metadata — AppleDouble `._*` files, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `ehthumbs.db` —, and is it fixed or configurable? (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/migration-skips-operating-system-metadata-and-nothing-else-babstw2c.md:29)
- Open: Migration skips operating-system metadata and nothing else (BR-babstw2c) BR-babstw2c/Q2 — What happens to an ignored file on disk: is it left where it is, removed with the old directory, or moved? The narrative only says it does not go into the archive. (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/migration-skips-operating-system-metadata-and-nothing-else-babstw2c.md:30)
- Open: The import drafts nothing from a comment (BR-6d5ch9e6) BR-6d5ch9e6/Q1 — A requirement or scenario whose text is only a comment: does the import warn about it too, and name what, or does it only draft nothing? The narrative names a warning for the empty Purpose alone. (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-import-drafts-nothing-from-a-comment-6d5ch9e6.md:30)
- Open: The report names what it did not count (BR-y0565652) BR-y0565652/Q1 — What is the field called in the `--json` output: `excluded`, `excludedMentions`, or another name? Neither the proposal nor the design names it. (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md:30)
- Open: The report names what it did not count (BR-y0565652) BR-y0565652/Q2 — Where are exclusions reported: only beside each `none` node (the design's words), or also beside a cited node that an excluded source mentions too, and/or once per report as a summary of the excluded classes? The same question for the existing `published-spec` (`kotta-spec/`) class: per node or per report? (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md:31)
- Open: The report names what it did not count (BR-y0565652) BR-y0565652/Q3 — Are mentions under `.kotta/` and `node_modules/` also named, as classes of their own, or only the four classes the design lists? (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md:32)
- Open: The report names what it did not count (BR-y0565652) BR-y0565652/Q4 — Does the human-readable output say it as well, or only `--json`, as the proposal writes? (openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md:33)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

16 delta nodes: 11 stated, 5 partly-inferred, 0 inferred.
Decided by: 0 human, 0 agent-proposed-human-approved, 16 agent-decided.

What the machine decided alone:

- A copy of the specification is not evidence (BR-ky1kcx0n) — from “A bizonyíték-szűrő SHALL kizárni a `.kotta/` workspace-t, az `openspec/` fát, a csomagok kiadott `kotta-spec/` mappáit és a `node_modules/` alatti fájlokat.” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Requirement: A specifikáció másolata nem bizonyíték)
- Every accepted promise is kept or admitted (BR-51zm9svr) — Where the sentence sits in the accepted rule, and the capability it now belongs to, were chosen by the agent; the accepted text is otherwise unchanged.
- Migration skips operating-system metadata and nothing else (BR-babstw2c) — from “A `kotta migrate` SHALL figyelmen kívül hagyni az operációs rendszer metaadatfájljait (`.DS_Store`, `Thumbs.db`, `desktop.ini`) a régi alak könyvtárainak olvasásánál” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: A migráció nem bukik rendszer-metaadaton)
- The import drafts nothing from a comment (BR-6d5ch9e6) — from “A `kotta import openspec` SHALL a narratív spec szakaszainak szövegét a Markdown-megjegyzések levágása után mérni. Egy szakasz, amelyben ezután nincs szöveg, SHALL NOT node-vázlatot adni;” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: Az import nem vázol node-ot megjegyzésből)
- The report names what it did not count (BR-y0565652) — from “A `gap` és a `modules` jelentés `--json` kimenete SHALL megnevezni a bizonyítékból kizárt forrásokat (útvonal-osztályok szerint)” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Requirement: A jelentés kimondja, mit nem számolt)
- A comment-only Purpose drafts no goal (EX-760f1n2b) — from “az import nem készít goal-vázlatot a képességhez, és a figyelmeztetései között megnevezi, hogy a képesség célja nincs kimondva” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose csak a generátor megjegyzését tartalmazza)
- A generated binding is neither cited nor a test (EX-40kqm294) — from “a kötés nem `cited` és nem `bound` szintű bizonyíték, és a generált fájl nem számít tesztfájlnak” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Generált narratív spec)
- A node named only in an excluded source says which (EX-jpvk80dx) — Which class each source falls into (an archived model/ as openspec-archive, a generated spec as openspec-spec) was supplied by the agent from the class names in the design.
- A node named only in the specification belongs to no module (EX-34zfdx6p) — from “egy csak `openspec/` alatt említett node besorolatlan, nem `(root)`” (openspec/changes/bizonyitek-csak-kodbol/design.md · 3. Modul-levezetés ugyanazon a szűrőn)
- A project's own specs directory still holds tests (EX-nbfdzwzz) — The concrete path and the expected level were supplied by the agent from the design's reason for not using a path pattern.
- A Purpose with prose drafts from the prose alone (EX-wcrazx8g) — from “az import a prózából vázol goal-t, a megjegyzés nélkül” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose szöveget és megjegyzést is tartalmaz)
- An archived change cites nothing (EX-1jcf80np) — from “a `gap` és a `modules` jelentés egyetlen node-ot sem sorol be ezek alapján” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Archivált change a repóban)
- An unknown entry still stops the migration (EX-whpsay21) — from “a migráció megáll, megnevezi a bejegyzést, és semmit nem ír” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: Ismeretlen fájl a régi workspace-ben)
- Finder metadata does not stop the migration (EX-ee22m627) — from “a migráció lefut, a fájl nem kerül az archívumba, és a terv megnevezi, hogy figyelmen kívül hagyta” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: Finder-metaadat a régi workspace-ben)
- Analyze the implementation gap (UC-0v1ag64q) — The wording inside the use case and the capability it now belongs to were chosen by the agent.
- Migrate a workspace (UC-qc2esx9h) — The wording inside the use case and the capability it now belongs to were chosen by the agent.

Conversation: none distilled for this change (`kotta narrative`).
