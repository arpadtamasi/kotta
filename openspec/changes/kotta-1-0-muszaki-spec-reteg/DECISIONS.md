# Decisions taken while implementing

Points the plan left open or made contradictory, what was done, and why. Phase 1 (sections 1 and 7
of `tasks.md`).

- **The archive is written in the v5 shape, whatever shape it came from.** The plan says the
  process data moves "untouched" and, at the same time, that a v4 workspace (oneanda's) is migrated
  in one run through the v4 → v5 → v6 chain. Both cannot hold for a v1–v4 workspace: the chain
  flattens state directories and renames the pre-vocabulary fields. Done: a v5 workspace's
  `process/` moves byte-for-byte; an older one is carried to the v5 shape on its way into
  `legacy/process/`, and `legacy/README.md` says so. Every archive then reads alike, and the last
  pre-1.0 release can read every one of them.
- **`validation` keeps only `strict`.** The plan keeps the `validation` section but its 0.x keys
  (`reject_unknown_profiles`, `require_verification_for_defined`,
  `require_review_evidence_for_done`) configure the process. Done: `strict` is kept, the other three
  are dropped and named in the plan. Nothing reads `strict` yet; it is the section's one key that
  is about the specification.
- **`spec_create` left the MCP surface.** The plan says the MCP server keeps "only read tools for
  the spec". Drafting a node is a write, so it stays on the CLI (`kotta spec new`) and leaves the
  chat surface, even though the draft is uncommitted and harmless. Phase 2's planning phase is where
  the chat gets its write back, through the gate.
- **A question naming a decision reference counts as answered at face value.** `core/questions.ts`
  is kept, as asked, but decision records are gone, so `decisionExists` has nothing to resolve
  against. Done: `kotta questions` reports a question that names a `D-…` as answered. The planning
  phase is where an answer is recorded and checked; until then the listing is a reading aid, not a
  gate.
- **`ui` and `mcp` judge the workspace they are given, not the cwd.** Both take `--workspace`, so
  the CLI's preAction hook exempts them and each refuses a pre-1.0 workspace itself, with the same
  message. The board no longer explains an old shape on the page: the spec says no other command
  runs on it.
- **`.a-team/` is still discovered.** Decision 8 says no compatibility layer, but a workspace that
  cannot be found cannot be migrated. Discovery of the pre-rename directory is kept for exactly one
  reader's sake — `kotta migrate` moves it onto `.kotta/` — and every other command refuses it like
  any pre-1.0 workspace. The `a-team` binary alias is gone.
- **The repository's own `.kotta/` stays on version 5, and its rules file with it.** The plan says
  not to migrate it in this phase. Consequences accepted: `.kotta/AGENTS.md` still describes the
  0.x product and names 0.11.1, so it left the install-line test's surfaces (the template is checked
  through `kotta init` instead); `kotta gap` on this repository's own spec will list many promises
  without evidence once the process code that cited them is gone, so the three "this workspace
  passes its own rule" self-checks were removed rather than kept red. A local clone of this
  repository is one of the migration test's fixtures, and it migrates without loss. The
  repository's `AGENTS.md` says the workspace is pending migration.
- **The oneanda demo import script left with the process.** `scripts/migrate-oneanda-demo.mjs`
  produced a v4-shaped `process/` from a Scrum backlog; nothing in 1.0 reads that output, and the
  `kotta migrate` v4 fixture covers the shape it wrote. `examples/demo-project/` is a static
  snapshot of the 0.x workflow and is left as documentation of the old product.
- **The `SPEC_REFERENCES_TASK` rule is gone.** It forbade a node from naming a task; there is no
  task to name. The "specification never points at execution" idea returns in phase 2 as the
  boundary between the model and the narrative, not as a task-id check.

Phase 2A (sections 3 and 4.2 of `tasks.md`: provenance, `spec new --into`, `plan`, `approve`,
`archive`, the `plan-change` skill).

- **A second published schema.** The brief puts provenance "into the JSON schema", and the only
  schema was the workspace configuration, whose test said it is the only one shipped. Done:
  `schemas/provenance.schema.json` is published beside it and kept identical to the validator's
  constants by a unit test (a published schema is enforced or not published).
- **`sources` may be empty only for `inferred`.** The contract lists `sources` without saying when it
  is required. Done: `stated` and `partly-inferred` need at least one source (something said it);
  `inferred` may name none. `quote` is optional everywhere; `inferred` is required unless `stated`.
- **`spec new` scaffolds provenance everywhere, not only `--into`.** "Provenance on every node" and
  "`spec new` scaffolds it" read together: the block is laid out empty on every new draft (and listed
  as unanswered). An accepted node may delete it; a present block is measured in full.
- **`kotta validate` measures open changes' nodes one by one; edges are `plan`'s.** A delta's edges
  resolve only against the merged view, so `validate` checks each `model/` node's id, form, fields,
  sections and required provenance, and `plan` checks the edges.
- **`--into` requires the change directory to exist.** A typo would otherwise create a stray change.
  The proposal is OpenSpec's to create; Kotta adds `model/` beside it.
- **An open question is still answered by naming a `D-…` reference, at face value** (phase 1's rule,
  kept, because decision records are gone). The planning skill tells the agent to record the human's
  answer in the node and remove the item; either way `approve` refuses while one is unanswered.
- **"At most 10 per change" is 10 per change, not per changed node.** The candidates are ranked by
  kind (lifecycle transition removed or reversed > names a changed or removed node > glossary
  non-example > named by a changed node > shares an edge target), and the report counts what it did
  not list.
- **A transition counts as reversed only when the way back is new.** A lifecycle that had both
  `a → b` and `b → a` and loses one has lost a transition, not reversed one.
- **Drift compares the statement, not the whole requirement.** "Whose SHALL sentence changed since
  the node" is read as: a bound requirement's text before any bold sub-heading must equal the node's
  first section, or still contain the sentence its `provenance.quote` records (what the node was
  derived from). The change's own `specs/` are compared with the merged model, `openspec/specs/` with
  the accepted one. In `plan` drift is reported and does not block; in `archive` any drift left in
  `openspec/specs/` after regeneration refuses, per "nem enged archiválni".
- **Which forms become requirements is fixed by form id** (business-rule, interface,
  quality-attribute, use-case, user-story; scenarios from `example` by `subjects`; purpose from
  `goal`). A project-added form is not generated into the narrative. With no goal naming the
  capability and no earlier Purpose to keep, the Purpose is a comment saying the model states none —
  nothing is invented to fill it.
- **`approve` is back on the CLI.** Phase 1's test asserted the word was gone from `--help` (it was the
  0.x approval surface). It now names the planning gate; the test checks the 0.x `approval` command
  stays gone and `approve <change>` is the gate.
- **`approval.yaml` records the basis as the delta hash itself** (`approval_basis: sha256:…`, over
  every file under `model/` by path and content), with `approved_by` from `--by` — not
  `KOTTA_APPROVER` — because the caller relays who said yes. `approve` refuses a `planning.md` older
  than any `model/` file by mtime, and also one whose recorded hash differs (mtime alone survives a
  checkout).
- **`archive` does not commit and does not re-ask.** It re-runs the mechanical checks (structure,
  merged view, removed-still-referenced, drift) before its first write, so a refusal changes nothing;
  none of them is a human gate. The archive date is the UTC date.
Phase 2B (module boundary and evidence levels, `tasks.md` 1.2, 2, 5.1).

- **A missing interface warns; it does not refuse.** The `module-boundary` spec says the check "hibát
  ad", the 2B brief says `validate` carries the checks as warnings. Done: in both `validate` and
  `kotta modules check` a missing interface, a straddler and a cross-boundary reference are warnings;
  only an interface whose `module:` names no declared module (`MODULE_UNKNOWN`) and a malformed
  `reference:` block refuse. Whether (a) should become an error once real workspaces are clean is
  the operator's call.
- **Which manifests declare a module.** npm/pnpm: only the directories the workspace globs list
  (`package.json` `workspaces`, `pnpm-workspace.yaml` `packages:`, with `!` exclusions); the root
  `package.json` is a module only when it declares no workspace. uv and pub workspace roots are not
  modules either; any other `pyproject.toml` with `[project]`, every `pubspec.yaml`, every `go.mod`,
  and Cargo workspace members (or a root `[package]`) are. One directory claimed by two ecosystems
  goes to the first (node, python, dart, rust, go).
- **Which external dependencies are listed.** Every `file:`/`path` and git dependency is; a plain
  version range only when an interface's `reference.module` names it or the installed package ships
  `kotta-spec/`. Listing every range would make `left-pad` a module relationship.
- **Working tree for `modules`, commit for `gap`.** `kotta modules`, `modules check` and the checks in
  `validate` read the working tree (`git ls-files --cached --others --exclude-standard`), like
  `validate` reads the spec; `gap` keeps reading committed bytes on the base branch and discovers the
  modules from the manifests at that same commit. The two can disagree about uncommitted work.
- **Placement uses `gap`'s evidence unfiltered.** A node's modules are those of every file `gap`
  counts as evidence, Markdown included; a design note outside every package that names an id makes
  the node straddle with `(root)`. Two paths are excluded from evidence everywhere: `node_modules/`
  and any `kotta-spec/` directory — a published copy of a promise is not evidence that it is kept.
- **The `reference:` block gained two optional keys.** `{ module, version, resolve }` cannot say which
  of the core's interfaces is meant, nor where a git core lives. Added: `id` (the foreign interface;
  without it the one with the same title, else the module's only interface) and `url` (for `resolve:
  git` when no manifest dependency gives one). Without `resolve`, file → package → git is tried in
  order and every failed attempt is reported.
- **What a pin is compared with.** A commit pin (7–40 hex) is stale when the matched core node's file
  changed in `pin..HEAD` (file and git resolution) or the published manifest's commit differs
  (package resolution, which carries no history). Any other pin is a version and must equal the
  resolved module's version exactly; ranges are not interpreted. Git resolution clones/fetches into a
  bare cache under the OS temp directory, so `modules check` touches the network only for git refs.
- **"Copy" is measured on the body, by words.** Twice the longest common word sequence over both
  lengths, above 0.8; only interfaces without a `reference:` are compared, against every foreign
  interface a `file:` dependency's repository or an installed `kotta-spec/` makes readable.
- **A cross-boundary reference is any frontmatter value naming a node id**, not only the registry's
  edge fields; a mention in the body is not a reference.
- **`kotta-spec/` layout.** `<module>/kotta-spec/` mirrors `.kotta/spec/`: `forms/` with the forms
  used, one directory per form, and `manifest.json` `{ format: 1, module, version, commit, nodes }`.
  "Rules and examples bound to an interface" is read as business-rule and example nodes whose
  frontmatter names the interface, plus examples naming those rules. The command replaces only its
  own output (a directory without `manifest.json` is refused) and does not edit `package.json`
  `files`; it says to.
- **`bound` is static; `prove` is a design note.** `bound` = the id in a test's name (`it`/`test`/
  `describe`/`group`/`testWidgets` strings; Rust `#[test] fn` and Python `def test_` names with the
  id's separators as `_`). `it.skip`, `xit` and `#[ignore]` do not bind. Not built: `kotta prove`
  would run the project's test command with a machine-readable reporter, map each result whose name
  carries an id to that node, and report `green | red | skipped` per node at the commit — a skipped
  test leaving the node unproven, with the reason (spec `evidence`, "Átugrott teszt").
- **The module summary in `gap` counts a straddler in each of its modules**, so rows can sum past
  the node count; nodes without evidence are counted apart as `unplaced`, except an interface with
  `module:`, which counts under that module as `none`. The per-evidence entries keep their old
  `{ kind, path }` shape.
- **2C: the board stays English, so the provenance labels are translated.** The brief names the
  marks in Hungarian; every other word on the board is English and the tests assert it. Level:
  `stated` / `partly inferred` / `inferred`; decider: `you said it` / `agent proposed, you approved`
  / `the agent decided`; the filter is "only what the agent decided". A level or decider outside
  the three enumerated values is left unmarked, never guessed into one of them.
- **2C: the narrative is read from the working tree, and only a repo-relative change path is
  fetched.** The board reads `.kotta/` from the base ref, but a change's `conversation.md` and
  `proposal.md` are in-flight planning that may not be there yet. `GET /api/narrative?path=` serves
  only `.md` files under `openspec/`, refusing absolute paths, `.`/`..` segments, backslashes, NUL
  and links whose real path leaves the folder. The drawer fetches a source only when it names
  `openspec/changes/<…>/<file>.md`; a bare `conversation.md · …` is shown as text, because the board
  shows accepted `.kotta/spec/` nodes, which have no change folder to resolve a bare name against.
  Phase 3's distillation should write sources repo-relative.
- **2C: Mermaid is a pinned devDependency, laid out by dagre, with everything else stubbed.**
  `mermaid@12.0.0` is bundled into `ui-dist/`, so the CLI never imports it at run time. Mermaid 12
  lays flowcharts out with ELK by default; the board forces `layout: "dagre"`, and
  `ui/vite.config.ts` replaces the other diagram types, the ELK and cose-bilkent layouts and KaTeX
  with a stub that throws, so the published `ui-dist/` is 1.3 MB instead of 5.5 MB. The initial
  bundle grew 24 kB (365 → 389 kB); Mermaid loads only when a diagram view opens.
- **2C: the review filter dims in the diagrams and filters in the lists.** Removing every node the
  agent did not decide would also remove the edges that give the rest their meaning, so the drawing
  keeps them at reduced opacity; the node lists and the specification list show only the
  agent-decided nodes.
- **2C: capability grouping groups the use cases, not the actors and goals.** In the use case
  diagram the capability subgraphs nest inside the use case column; actors and goals are shared
  across capabilities and stay in their own columns. The entity map groups every entity; once any
  node carries a capability, the rest fall into a "no capability" group.
- **2C: a Transitions line whose reason holds another arrow is prose.** That is a paragraph
  describing several transitions, and reading only its first would draw a machine the text does not
  describe. A section with some readable lines is drawn, and its unread lines are listed under the
  drawing. A terminal state is one named in a sentence that says "terminal" or "végállapot", read
  from States and the unread lines. All three state machines in this repository's own `.kotta/`
  are written as paragraphs and are shown as prose, not drawn.
- **2C: the diagram views read the standard form ids.** `actor`, `goal`, `use-case`,
  `user-story`, `entity` and `state-machine` are named in `ui/src/model.ts`; a project's own form
  still appears in the specification list and in every node's edges, but no diagram draws it.
- **2C: the board had no dark theme; one was added at the token level.** The ramps turn over under
  `prefers-color-scheme: dark`, and the rail, drawn in the text colour, turns light with them.
  Diagrams read the tokens on each draw and redraw when the scheme changes. The same commit removed
  434 stylesheet rules no board component used any more (task, batch, run, approval, timeline…).
  `ui/UX-SPEC.md` and the old console captures in `ui/spec-assets/` were left; the spec already
  marks itself superseded.
- **2C: the accessibility check runs in jsdom.** The brief asks for the axe pattern on every new
  view; the board has no Playwright suite, so each view's test runs `axe-core` on the rendered
  container and fails on a serious or critical violation, with `color-contrast` off because jsdom
  computes no colours. Both themes were drawn once in a real Chromium to check that Mermaid renders
  and that a drawn node opens its drawer.

## Phase 3C — OpenSpec import

- **3C: a section holding only an HTML comment is empty to validation.** The import leaves the
  not-derivable sections with a note, as the brief asks; counted as text, the note would hide 486
  gaps on oktat-ai from `kotta plan`. `validateNodeSet` now strips comments before the emptiness
  check (one line in `src/spec/registry.ts`). No other test relied on a comment-only section.
- **3C: the note, the goal title and the proposal are English.** Kotta writes its own text in
  English; the narrative's text is copied as it is. The goal a Purpose becomes is titled
  `Purpose of <capability>`, a name the planning phase is free to change.
- **3C: an example's empty Given is not derivable either.** OpenSpec scenarios carry WHEN/THEN; the
  example form requires Given, so it gets the same note (226 of the 486 gaps on oktat-ai). `AND`
  and `BUT` continue the step above; a continuation line joins its step.
- **3C: the quote is the first sentence, cut to 30 words.** Cut without an ellipsis, so it stays a
  substring of the narrative and `narrativeDrift` still recognises the source statement.
- **3C: matching an accepted node.** A requirement bound by `<!-- kotta: ID -->` changes that node
  if it is a requirement form (business-rule, interface, quality-attribute, use-case,
  user-story); otherwise, exactly one accepted requirement-form node with the same title
  (case- and whitespace-insensitive) is matched. Several candidates, or a binding to an unknown or
  wrong-form id, draft a new node and say so in the proposal's "Matching notes". A scenario matches
  by binding, or by title only among examples already proving the matched rule; a Purpose matches
  by binding, title, or the one accepted goal with the same `capability`. A matched node keeps its
  file name, its form and its other sections; only the sections the narrative states are replaced,
  its provenance becomes the import's, and an existing `capability` is kept.
- **3C: the archive is history, not input.** `openspec/changes/archive/**` is listed in the
  proposal's History for the planning phase to read for rationale; nothing is drafted from it.
  Open (unarchived) changes are neither listed nor imported.
- **3C: the import is refused over an existing change directory** and writes nothing; it reads only
  `openspec/specs/<capability>/spec.md` (a `spec.md` directly under `specs/` is not a capability).
