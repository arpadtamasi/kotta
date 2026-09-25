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
- **3A: a glossary contrast is a negation flipped, not a shared word.** A candidate needs one
  sentence of a claim section (Rule, Meaning, Definition, Then, Postconditions, Invariants,
  Response) that names the term (every content word of its title), names a non-example's subject
  (two thirds of its content words, numbers exact, not counting the tokens that named the term),
  states a word the non-example's explanation negates, and carries no negation beyond the subject's
  own. Words match across Hungarian inflection by shared stem or, from five letters, as a substring
  ("beleszámít" ⊃ "számít"). A non-example whose explanation negates nothing yields no candidate:
  that is where the test cannot decide, so it stays silent. The term's Definition/Meaning is not
  compared — "says something else than the definition" is not lexically decidable. On the Casino
  archive the old eight candidates are gone and none replaces them; the planted contradiction
  (a changed rule counting undecided majority points toward the Kint vagyok threshold) is found.
  The real one in the archive — the use case step "a 11 összpontot elérő fél bemondja a győzelmet"
  against Pontbontás' invariant — is not: it is in a Main success scenario and names no term. That
  is the agent's `judged` block's job.
- **3A: the planning fixture's glossary term now negates.** "pause — stops the clock and keeps the
  game" became "stops the clock, but does not end the game", so the fixture's intended contrast
  (a paused game quits at once) is still a candidate under the narrower rule.
- **3A: (f) shows what a machine decision rests on.** `inferred` when filled; otherwise the
  `quote`, with the first source in brackets; otherwise the first source; "(no account…)" only when
  the block has none of them.
- **3A: the judged block lives between two HTML comments in (c).** `kotta plan` copies whatever is
  between `<!-- kotta:judged … -->` and `<!-- /kotta:judged -->` into the new report, whatever the
  delta, and reports its list items as `data.judged`. It is not re-validated and does not block.
- **3A: the normative sections are the registry's, with defaults for installed registries.** A form
  declares `normative_sections` (business-rule [Rule], interface [Postconditions, Invariants],
  quality-attribute [Response]); a registry written before the key existed gets those defaults by
  form id, so `kotta validate` warns on the Casino's 49 rules, interfaces and quality attributes
  without a re-sync. One of the listed sections must carry `\b(SHALL|MUST)\b` (case-sensitive, as
  OpenSpec reads it); all-empty sections are left to the missing-section check. For the quality
  attribute, "the obligation section" was read as `Response`. Code: `SPEC_NODE_NOT_NORMATIVE` —
  a warning in `validate` for accepted nodes, an error for a change's `model/` nodes, a blocking
  structure issue in `plan` (and therefore in `approve` and `archive`).
- **3A: a comment is not content.** The `spec new` scaffold puts the SHALL/MUST hint as an HTML
  comment under each normative heading, so the required-section check now ignores comments: a
  section holding only a comment is empty, as before the hint existed.
- **3A: the generator carries sections verbatim, as before.** The brief says "the Rule's first
  sentence into the requirement body"; the generator already carries the whole Rule (then the other
  sections under bold labels) unchanged, and the drift check compares on that. Narrowing to the
  first sentence would drop text, so it was not done.
- **3A: OpenSpec 1.13.1 accepts GIVEN; it rejects a requirement without a scenario.**
  `openspec validate --specs --strict` on the Casino's generated specs: every one of the 67
  requirements lacks SHALL/MUST (a warning, fatal under --strict), and seven requirements have no
  scenario (an error) — all seven interfaces, because no example may name an interface. GIVEN lines
  pass as they are and were left. The generator now gives an interface without an example its own
  contract as the scenario, word for word: "#### Scenario: <title> keeps its contract", GIVEN the
  Preconditions, THEN the Postconditions. Regenerated in a scratch copy, the Casino specs fail only
  on the keyword; with a keyword inserted they pass all five. Other requirement forms without an
  example (a use case, a user story) still get no scenario: `archive` warns
  `NARRATIVE_NO_SCENARIO`, it does not invent one.
- **3A: open — use cases and user stories are not normative forms.** 18 of the Casino's 67
  requirements are use cases and user stories; OpenSpec wants SHALL/MUST in them too, and the brief
  names only rules, interfaces and quality attributes. Their requirements will keep failing
  `openspec validate --strict` until the operator decides whether their Intent/Story must carry the
  keyword (a one-line `normative_sections` in their forms).
- **3A: a brief Purpose is a warning.** Archive warns `NARRATIVE_PURPOSE_BRIEF` when a generated
  Purpose is under OpenSpec's 50 characters, comments not counted — including the placeholder
  comment written when no goal names the capability (OpenSpec itself counts the comment and passes
  it). Nothing is padded.
- **3A: `narrative:` is read from `.kotta/config.yaml` first, `openspec/config.yaml` second.** The
  first file that sets the key decides; an unknown value refuses archive with `CONFIG_INVALID`.
  The published config schema gained the optional `narrative` enum. `authored`: archive lands the
  model, writes nothing under `openspec/specs/`, returns every bound requirement's drift in
  `data.drift` and as `NARRATIVE_DRIFT` warnings, and succeeds. `generated`: as before, drift
  refuses. `kotta plan` is unchanged in both modes: it reports drift in (e) either way.

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

Phase 3B (narrative distillation, `kotta narrative`).

- **3B: the cited part is written ` · <part>`, and `#<part>` is accepted too.** The brief asks for
  `conversation.md#<szakasz>`; the shared provenance contract and the board's `parseSource` use
  `<file> · <part>`, and a `#` source was not recognised as narrative. Both now resolve (the board
  reads a `.md#part` anchor); the skill and the distillate teach the ` · ` form.
- **3B: every item is a heading with an id and a UTC minute** — `SZ1` intent, `J1` approved
  proposal, `E1` path turned down, `K1` question, `P1` unpaired — because the board cites by "first
  heading whose text contains the part". Times are UTC so the file is the same on every machine;
  ids number per kind in time order across all logs read.
- **3B: pairing reads only the agent message directly before a human message**, and within a Claude
  Code turn only its last text entry (the agent's final reply). The agent message is a *proposal*
  (options with a question, or a proposal phrase: javaslom, ajánlom, szeretnéd, ha akarod, mehet?,
  I suggest, should I, want me to…), a *question* (a `?` in its last two paragraphs), or a
  *statement*. A reply is a *yes* (a short run of yes-words, or up to eight words starting with one
  and no "de/but/viszont"), a *pick* among offered options (`b`, `az a`, `B-t`), a *no* (starts with
  nem/ne/no/inkább/instead…), or unclear. Yes or a pick of the recommended option → `J`; no, or a pick
  of a different option than the one the agent recommended → `E`; any reply to a question → `K`;
  unclear, or a bare "mehet" after a statement → `P`. A human message after a statement, or with no
  agent message before it, is intent. Every human message appears exactly once, verbatim; the agent's
  text is shortened from the front to ~900 characters.
- **3B: known limits of the heuristic.** An imperative yes ("takarítsd", "csináld meg az agentet") is
  unclear, not a yes; a proposal buried in an earlier text entry of the same turn is not seen; a "no"
  to "should I keep X?" is filed as a path turned down even when it agrees with the agent's own lean;
  a recommendation is read only when the agent names one option letter or number. Real logs from this
  machine gave mostly intents and a few `J`/`P` items; the rest is the human's call in `P`.
- **3B: a hand-edited distillate is never overwritten.** The file carries `generated_by: kotta
  narrative` and a `digest` of its body; a file without the marker, or whose body no longer matches,
  is refused with `NARRATIVE_EDITED` and left alone. There is no `--force`: moving the file aside is
  the override. `--since` is a filter, not an append.
- **3B: the filter runs over the rendered file, not the raw log.** It counts only what would have
  been written (a secret in a truncated agent paragraph is not counted). Kinds: `api-kulcs` (`sk-…`),
  `github-token` (`gh[opsur]_…`, `github_pat_…`), `aws-kulcs` (`AKIA`/`ASIA`), `jwt`, `titok-érték`
  (the value after `password:`/`token=`/`api_key:`/`Authorization: Bearer`), `e-mail`, `telefonszám`
  (`+…`, `06 …` or `(…)` forms with 9–15 digits, so dates, versions and ids stay), and
  `otthoni-útvonal` (`/Users/<n>/`, `/home/<n>/`, `C:\Users\<n>\` → `~`, and the `-Users-<n>-`
  folder names Claude Code gives projects). The log paths under "Nyers forrás" are shortened the same
  way but not counted: they are the command's record, not the conversation.
- **3B: what is skipped.** Claude Code: `isSidechain`, tool-only entries (tool_use, tool_result,
  thinking), `isMeta` and compact summaries, `<system-reminder>`/`<task-notification>`/
  `<local-command-…>`/`<command-…>`, `Base directory for this skill`, `[Request interrupted…`,
  image-only messages, human messages over 4000 characters; `<system-reminder>` and `<ide_…>` blocks
  inside a human message are cut out, the rest kept. Codex: non-message response items, `developer`
  role, `# AGENTS.md instructions`, `<environment_context>`, `<skill>`, `<turn_aborted>`, image tags;
  the IDE extension's "# Context from my IDE setup" keeps only what follows "## My request for
  Codex:". Every skip is counted by reason under "Nyers forrás". A file under a `--from` directory
  that is neither format is named and skipped; a single `--from` file that is neither is refused.
- **3B: `plan` reads the conversation, it does not require it.** `ChangeAnalysis.conversation` names
  the file and each delta-node source citing a `conversation.md` that does not resolve (not the
  repo-relative path, no such file, no part named, no heading naming the part); `planning.md` lists
  them under (f). Non-blocking: the provenance block itself is still measured in (a).
- **3B: the rules template names `kotta narrative`; this repository's own `.kotta/AGENTS.md` was not
  re-synced** (upkeep for 3D). The CLI surface snapshot was regenerated; the new command widens the
  help column, so the whole snapshot re-wraps and will conflict with 3A/3C — regenerate at merge.
