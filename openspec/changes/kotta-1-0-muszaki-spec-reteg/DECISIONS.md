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
