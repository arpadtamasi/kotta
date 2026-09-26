---
change: bizonyitek-csak-kodbol
generated_at: 2026-09-26T14:22:55.960Z
delta_hash: sha256:e8429e974d0df98ef1a05d3af7057713c621701d42c87a4b60041d7191513483
ready_for_approval: true
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
- A comment-only scenario is named in a warning (EX-sk087v74) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-comment-only-scenario-is-named-in-a-warning-sk087v74.md
- A generated binding is neither cited nor a test (EX-40kqm294) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-generated-binding-is-neither-cited-nor-a-test-40kqm294.md
- A node named only in an excluded source says which (EX-jpvk80dx) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-node-named-only-in-an-excluded-source-says-which-jpvk80dx.md
- A node named only in the specification belongs to no module (EX-34zfdx6p) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-node-named-only-in-the-specification-belongs-to-no-module-34zfdx6p.md
- A package's own openspec tree is not excluded (EX-p4y88nga) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-package-s-own-openspec-tree-is-not-excluded-p4y88nga.md
- A project's own specs directory still holds tests (EX-nbfdzwzz) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-project-s-own-specs-directory-still-holds-tests-nbfdzwzz.md
- A Purpose with prose drafts from the prose alone (EX-wcrazx8g) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/a-purpose-with-prose-drafts-from-the-prose-alone-wcrazx8g.md
- An archived change cites nothing (EX-1jcf80np) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/an-archived-change-cites-nothing-1jcf80np.md
- An uncommitted specification file is not offered as evidence (EX-5h170c3n) — example, openspec/changes/bizonyitek-csak-kodbol/model/examples/an-uncommitted-specification-file-is-not-offered-as-evidence-5h170c3n.md
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
- judged (settled, agent-decided): *Analyze the implementation gap* names uncommitted paths that could carry the missing evidence; that hint now reads through the evidence filter, so an uncommitted copy of the specification is never offered (the use case, and the example *An uncommitted specification file is not offered as evidence*). The operator did not rule on it; it follows from *A copy of the specification is not evidence*.
- judged: *Every accepted promise is kept or admitted* refuses (non-zero exit) every node that is neither evidenced nor admitted, softened only for "work that has not begun". The proposal expects 184 → 0 cited on the measured project, where the code names no id: after this change its `kotta gap` refuses 184 nodes unless each is admitted. Is that the intended consequence, or does "the work has not begun" cover them? The delta states neither.
- judged: *Shape the specification* calls a specification id written into a node's text "a citation" and speaks of "the same analysis that treats a cited id as evidence"; the delta says the specification and every copy of it is never evidence. The nodes themselves were already excluded (`.kotta/`), so no behaviour conflicts, but "citation" now means two things — a reference between nodes and evidence in code. Keep the word, or reword the use case?
- judged: the narrative requirement *Minden elfogadott ígéretről látszik, megépült-e* (bound to *Every accepted promise is kept or admitted*) also demands that the report tell module-level from test-level binding; no accepted node and no delta node states that. Drift reads zero only because the node's provenance quote matches the evidence sentence. The sentence comes from the unarchived 1.0 change's narrative, not from this change.
- judged (settled by the operator, 2026-09-26): the unarchived 1.0 migration narrative says "semmi nem törlődik"; the skipped operating-system metadata is now deleted with the old directory and named in the plan, and *Migrate a workspace* says this is the only thing deleted without being carried over. The 1.0 narrative sentence still reads unqualified.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

- openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md:22 — requirement 'A specifikáció másolata nem bizonyíték' says “A bizonyíték-szűrő SHALL kizárni minden azonosító-keresésből a `.kotta/` workspace-t, a repó gyökerében álló `openspec/` fát — a change-eket, az archívumot és a generált narratív specet —, a csomagok kiadott `kotta-spec/` mappáit és a `node_modules/` alatti fájlokat. A `kotta gap` és a modul-levezetés SHALL ugyanezt az egy szűrőt használni, hogy egy node modulja sose a specifikáció másolatának helyéből adódjon; a nem commitolt útvonalak ajánlása is ezen a szűrőn megy át. Kizárt forrásban lévő fájl SHALL NOT tesztnek számítani attól, hogy útvonalában `specs/` szerepel. A kizárás MUST a Kotta által ismert spec-forrásokat nevezze, nem könyvtárnév-mintát: a projekt saját `specs/` könyvtára továbbra is teszt, és egy csomag gyökér alatti saját `openspec/` fája nincs kizárva.”; A copy of the specification is not evidence (BR-ky1kcx0n, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/a-copy-of-the-specification-is-not-evidence-ky1kcx0n.md) says “The evidence filter SHALL exclude, from every search for a node's id, the `.kotta/` workspace, the `openspec/` tree at the repository root — its changes, its archive and its generated narrative specs —, the published `kotta-spec/` directories of packages, and everything under `node_modules/`. `kotta gap` and the module derivation SHALL use this one filter, so that a node's module never follows from where a copy of the specification lies. A file in an excluded source SHALL NOT count as a test because its path contains `specs/`. The exclusion MUST name the specification sources Kotta itself knows, never a directory name pattern: a project's own `specs/` directory keeps counting as tests, and an `openspec/` tree a package keeps below the root is not excluded.”.
- openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md:45 — requirement 'A jelentés kimondja, mit nem számolt' says “A `kotta gap` és a `kotta modules` SHALL megnevezni a bizonyítékból kizárt forrásokat útvonal-osztály szerint. Hat osztály van: `workspace` (`.kotta/`), `openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec` (egy csomag `kotta-spec/`-je) és `dependency` (`node_modules/`). Minden `none` szintű node mellett a jelentés SHALL kimondani, melyik kizárt osztály említi, és a jelentés feje SHALL egyszer összesíteni a kizárásokat; minden osztályra, a `published-spec`-re is, ugyanez a szabály. A `--json` kimenetben ez SHALL az `excluded` mező legyen; az ember-olvasható kimenet SHALL egy összesítő sorban nevezni meg a kizárásokat.”; The report names what it did not count (BR-y0565652, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md) says “`kotta gap` and `kotta modules` SHALL name the sources they excluded from evidence, by path class. There are six classes: `workspace` (`.kotta/`), `openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec` (a package's `kotta-spec/`) and `dependency` (`node_modules/`). Beside each node at level `none` the report SHALL say which excluded classes mention it, and the head of the report SHALL summarize the exclusions once; every class, `published-spec` included, follows the same rule. In the `--json` output this SHALL be the field `excluded`. The human-readable output SHALL name the exclusions in one summary line.”.
- openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md:3 — requirement 'Az import nem vázol node-ot megjegyzésből' says “A `kotta import openspec` SHALL a narratív spec minden szakaszának — a képesség Purpose-ának, a követelménynek, a scenariónak — szövegét a Markdown-megjegyzések levágása után mérni. Egy szakasz, amelyben ezután nincs szöveg, SHALL NOT node-vázlatot adni. Üres Purpose-nál az import SHALL a figyelmeztetései között megnevezni a képességet, amelynek célja nincs kimondva, hogy a tervezés-fázis rákérdezzen; üres követelménynél vagy scenariónál SHALL szintén figyelmeztetni, a képesség és a szakasz megnevezésével, nem csendben kihagyni.”; The import drafts nothing from a comment (BR-6d5ch9e6, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/the-import-drafts-nothing-from-a-comment-6d5ch9e6.md) says “`kotta import openspec` SHALL measure the text of every narrative section — a capability's Purpose, a requirement, a scenario — after removing its Markdown comments. A section with no text left SHALL NOT yield a node draft. Where a capability's Purpose is left empty, the import SHALL name that capability among its warnings as one whose purpose is not stated, for the planning phase to ask about. Where a requirement or a scenario is left empty, the import SHALL warn as well, naming the capability and the section: it does not skip it in silence.”.
- openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md:22 — requirement 'A migráció nem bukik rendszer-metaadaton' says “A `kotta migrate` SHALL figyelmen kívül hagyni az operációs rendszer metaadatfájljait a régi alak könyvtárainak olvasásánál. A lista rögzített, nem konfigurálható: `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini`. Ilyen fájl SHALL NOT az archívumba kerülni; a régi könyvtárával együtt törlődik, és a terv SHALL megnevezni minden kihagyott fájlt. Ez az egyetlen, amit a migráció átvitel nélkül töröl. Minden más ismeretlen bejegyzésen SHALL továbbra is megállni, a bejegyzést megnevezve, írás nélkül.”; Migration skips operating-system metadata and nothing else (BR-babstw2c, openspec/changes/bizonyitek-csak-kodbol/model/business-rules/migration-skips-operating-system-metadata-and-nothing-else-babstw2c.md) says “`kotta migrate` SHALL ignore the operating system's metadata files when it reads the directories of an older workspace shape. The list is fixed and not configurable: `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini`. Such a file SHALL NOT be carried into the archive; it is deleted with the old directory it sits in, and the plan SHALL name each file it left out. This is the only thing a migration deletes without carrying it over. On any other entry it does not know it SHALL still stop, name the entry, and write nothing.”.

Reported, not repaired: the model is the accepted truth, and which side moves is a human's call.

## (f) Provenance

19 delta nodes: 11 stated, 7 partly-inferred, 1 inferred.
Decided by: 0 human, 9 agent-proposed-human-approved, 10 agent-decided.

What the machine decided alone:

- Every accepted promise is kept or admitted (BR-51zm9svr) — Where the sentence sits in the accepted rule, and the capability it now belongs to, were chosen by the agent; the accepted text is otherwise unchanged.
- A comment-only Purpose drafts no goal (EX-760f1n2b) — from “az import nem készít goal-vázlatot a képességhez, és a figyelmeztetései között megnevezi, hogy a képesség célja nincs kimondva” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose csak a generátor megjegyzését tartalmazza)
- A generated binding is neither cited nor a test (EX-40kqm294) — from “a kötés nem `cited` és nem `bound` szintű bizonyíték, és a generált fájl nem számít tesztfájlnak” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Generált narratív spec)
- A node named only in the specification belongs to no module (EX-34zfdx6p) — from “egy csak `openspec/` alatt említett node besorolatlan, nem `(root)`” (openspec/changes/bizonyitek-csak-kodbol/design.md · 3. Modul-levezetés ugyanazon a szűrőn)
- A project's own specs directory still holds tests (EX-nbfdzwzz) — The concrete path and the expected level were supplied by the agent from the design's reason for not using a path pattern.
- A Purpose with prose drafts from the prose alone (EX-wcrazx8g) — from “az import a prózából vázol goal-t, a megjegyzés nélkül” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: A Purpose szöveget és megjegyzést is tartalmaz)
- An archived change cites nothing (EX-1jcf80np) — from “a `gap` és a `modules` jelentés egyetlen node-ot sem sorol be ezek alapján” (openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Scenario: Archivált change a repóban)
- An uncommitted specification file is not offered as evidence (EX-5h170c3n) — The agent decided that the gap hint about uncommitted paths reads through the evidence filter; it follows from the rule, the operator did not rule on it.
- An unknown entry still stops the migration (EX-whpsay21) — from “a migráció megáll, megnevezi a bejegyzést, és semmit nem ír” (openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Scenario: Ismeretlen fájl a régi workspace-ben)
- Analyze the implementation gap (UC-0v1ag64q) — The wording inside the use case, the capability it now belongs to, and that the uncommitted-path hint reads through the evidence filter were chosen by the agent.

Conversation: none distilled for this change (`kotta narrative`).
