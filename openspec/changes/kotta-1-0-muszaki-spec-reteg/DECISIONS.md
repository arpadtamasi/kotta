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
