# Changelog

All notable changes to Kotta (called A-Team before 0.3.0) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2026-08-20

### Fixed

- **Releasing a claim no longer strands the contract.** `kotta claim release --force` deleted the
  claim and left the contract `active` with no claim and no execution context, where `start`,
  `execute`, `execute --resume`, `reopen` and `cancel` all refused it — the only exit observed was
  hand-editing `status` back, which the rules forbid. Release is the documented inverse of `start`,
  so it now returns the contract to `defined` in the same commit that deletes the claim. The branch
  and the worktree are still preserved, and `start` reuses exactly the pair the contract records
  instead of refusing with `Branch already exists`; a branch of that name the contract does not
  record still refuses.
- **`observation new` commits what it writes.** Without `--discovered-during` it wrote the
  observation and regenerated the index without committing either, so the control plane was left
  dirty and Kotta's own write blocked Kotta's next command: `contract cancel` and `contract reopen`
  both failed with `Repository is dirty` immediately after a successful capture. The standalone path
  now takes the same control-plane mutation and the same commit as the attributed one. It records no
  lifecycle event, because a standalone observation has no contract to attribute one to.
- **A batch completes on its whole subtree, not just its own contracts.** The automatic completion a
  closing contract triggers read only the batch's `contracts` array, so a parent holding both direct
  contracts and child batches closed on its last direct contract while a child was still open — and
  a parent whose child finished last was never revisited at all. The automatic path and `batch close`
  now ask one shared question about the whole subtree, and read member state the same way, so a
  contract executing in its own worktree is no longer mistaken for a defined one.
- **Every caller gets its own frontmatter.** `parseMarkdown` returned the object gray-matter
  memoizes for a given source, and commands edit frontmatter in place, so a second parse of an
  identical file inside one process saw the first caller's edits. It made `kotta migrate` report an
  empty change list when it planned a file twice, and the long-lived board server parses repeatedly.

## [0.6.0] - 2026-08-15

### Added

- **The board answers age, run cost and intent at scan speed.** Every list exposes how old its
  entities are; a running contract shows live elapsed time derived from its claim, and the last
  execution shows its duration and token usage — `Not recorded` where a run recorded none, never a
  guessed zero. A contract's drawer opens on a structured **Brief** — goal, success conditions,
  scope, constraints, verification — with provenance and specialist sections under **Context** and
  the conversation and lifecycle stream last under **Activity**, reached by an arrow-key tab strip.
  Previously the drawer was one long wall that opened on frontmatter and buried the brief under the
  chat.
- **A batch reads as the tree it is.** Batches, the Run view and the batch drawer share one
  hierarchy component: a parent, the child batches it groups and the contracts underneath them, with
  progress counted over the whole subtree and the dependency waves drawn from the same tree. The
  lists themselves share one control row — state chips with live counts and an explicit sort — so
  Observations, Contracts and Batches narrow and order the same way. Previously nesting was recorded
  on disk and invisible on screen, and each list had its own controls or none.
- **`show` for every entity, and short ids that resolve.** `kotta contract show`,
  `kotta observation show`, `kotta decision show` and `kotta batch show` print one entity's state,
  its set facts and its body, with `--json` and as read-only chat tools. Separately, the short id
  the CLI displays everywhere — `T-rf5d4tfp` — is now accepted by every command that takes an id,
  not only by `show`; previously Kotta printed an identifier and then answered "not found" when it
  was typed back. An ambiguous short form is refused naming the full ids it matched.
- **`list` for every entity.** `kotta contract list`, `kotta observation list`, `kotta decision list`
  and `kotta batch list` print their entities with state, title and id, narrow with a repeatable
  `--state`, and support `--json` — the shape `kotta claim list` already had and nothing else did.
  All four also reach the calling chat as read-only tools. Previously `kotta status` returned counts
  and bare ids, and the only way to see what a workspace contained was to read `.kotta/` by hand,
  which is what the workspace rule forbids.
- **`no-change` execution state.** `contract execute` captures the worktree's baseline — the contract
  branch tip and its porcelain status — before it launches, and compares afterwards. An agent that
  exits 0 and reports work it never did is recorded as `no-change` instead of `implemented`, and the
  human output says so plainly and names what to check. Commits and uncommitted changes both remain
  `implemented`. The existing failure ladder keeps its order and is still evaluated first.
- Each execution event now carries the resolved state, the agent that ran, the baseline and resulting
  commit, whether uncommitted changes remain, the exit code, and the agent's own printed output —
  stored as reported and attributed, never promoted into the state decision. A resume appends a new
  record instead of rewriting the previous one.

### Fixed

- A completed run's record is no longer discarded when the control worktree holds unrelated dirt:
  the execution record is written with `requireClean: false`, matching every sibling caller. A write
  that fails for a real reason now reports the run that is at risk and says the work exists but is
  unrecorded, instead of claiming something failed to start.
- `execute --resume --agent <other>` updates the claim to the agent that actually ran, so a later
  bare `--resume` relaunches it.
- **What a launched agent may do is now the operator's decision.** `agents.permission_mode` in
  `.kotta/config.yaml` is passed to the agent as `--permission-mode`. Nothing is baked into the
  invocation: with no mode set — the shipped default — Kotta passes no flag and the agent's own
  project settings decide, so a launched run never receives authority the caller had not granted.
  Previously `claude` was invoked bare, asked for permission nobody could grant, and reliably
  changed nothing while the run was recorded as an implementation. An unconfigured run now says so
  at launch and is recorded as `no-change`; a mode that forbids edits by definition (`plan`) is
  refused at launch naming the cause.

## [0.5.0] - 2026-08-05

### Added

- **Caller-chat control plane.** `kotta mcp` exposes structured status, contract, observation,
  caller-execution, conversation and approval tools over stdio MCP. Consequential lifecycle tools
  interrupt the calling chat with one exact approve/reject/cancel elicitation, link the durable
  receipt to the visible human response, and apply the existing validated domain mutation once.
- `kotta integrate codex` idempotently connects those tools in project-scoped
  `.codex/config.toml` without replacing existing Codex settings. `contract_create` returns the new
  id and path as structured data, so an agent never asks the human to copy an identifier.

### Changed

- **The board is read-only.** It continues to reconstruct canonical state, conversation,
  lifecycle and approval history from the base branch, but its UI has no composer or mutation
  controls and every historical POST endpoint returns `405`. Human approvals live in the calling
  chat; the CLI remains a human-operated recovery and terminal-first fallback.
- `kotta contract new` human output now prints both the created contract id and canonical path.

## [0.4.2] - 2026-08-05

### Fixed

- The maintainer-triage integration fixture now supplies its own Git identity, so CI exercises
  observation-resolution state commits without relying on machine-global configuration.

## [0.4.1] - 2026-08-05

### Fixed

- Human-approved CLI contract signing and observation resolution now serialize through the control
  plane and commit their canonical state instead of leaving `main` dirty.
- The public install path uses `@arpadtamasi/kotta`; npm rejected the unscoped `kotta` name as too
  similar to existing packages. The installed executable remains `kotta`.
- The live-site quickstart now advertises the current package and version.

## [0.4.0] - 2026-08-05

### Added

- **Live control plane and persistent contract chat.** Canonical lifecycle state, claims, visible
  messages, failed turns, execution outcomes and scoped approvals remain on the configured base
  branch while implementation stays isolated in feature worktrees. The board reconstructs the
  timeline after restart and offers chat-first sign, disposition, review, close and batch-close gates.
- **Explicit caller execution.** `kotta contract start <id> --agent <agent> --caller` creates the
  normal isolated branch and worktree but labels execution as inherited context. Fresh brief-only
  `contract execute` remains the default.

### Changed

- Batch coordinators now use their own linked worktree, so starting a batch no longer switches the
  control checkout away from `main`.
- Contract readiness now accepts `None`, `N/A` or `No open decisions`, with an optional final period,
  as equivalent empty `Open decisions` markers. A real unresolved choice still blocks signing.

- **The vocabulary is now observation / contract / batch, and one command carries any workspace
  across (D-01kz240dn155hb97h6px6n2p85).** `finding` → **observation**, `ticket` → **contract**,
  `package` → **batch**, and the previously decided `ready` → `defined` rides along. Every layer moves
  together: CLI verbs (`kotta observation`, `kotta contract`, `kotta batch`), stored state directories
  (`defined/`, `observations/`, `batches/`), frontmatter fields (`package` → `batch`,
  `source_finding` → `source_observation`, a batch's `tickets` → `contracts`, `finding_type` →
  `observation_type`, a claim's `ticket` → `contract`), the config file (`packages:` → `batches:`,
  `version: 2`), the JSON schemas, the API routes, the bundled skills and the documentation. The
  promotion verb needed a new name, because `define` already means writing the contract: a contract
  becomes binding when it is **signed**, so `kotta contract sign <id> --approve` and
  `kotta batch sign <id> --approve` produce the `defined` state.

- **`kind` is gone from batches.** With the entity called a batch, `kind: batch` was a tautology and
  `sprint`/`milestone`/`mission` never carried meaning — all 21 batches in the largest workspace were
  `kind: batch`. `batch new` no longer accepts `--kind`, the field is out of the schema, and a batch
  file that still carries it loads with a warning naming `kotta migrate`.

- **Identifiers do not move (D-010).** No id, no filename and no reference *value* changes: this is
  vocabulary, not identity. `kotta migrate` compares the id set before and after and refuses to lose
  one.

### Added

- **`kotta migrate`** — one command that takes a workspace from any older shape to the current one:
  the workspace directory (`.a-team` → `.kotta`), the entity directories, the stored statuses, the
  frontmatter field names and the config. `--dry-run` reports exactly what it would change and writes
  nothing; running it twice reports "already on the current shape"; an interrupted run is finished by
  running it again, because every step is derived from what is on disk rather than from a progress
  marker. It is the only reader of the old shape — every other command refuses a pre-vocabulary
  workspace with an error that names it. This repository's own workspace was migrated by running it.

- **The board explains an empty page instead of showing one.** The board reads a stable base ref, not
  the working tree, so a migration that has not reached that ref yet leaves the header path right and
  the content gone. `kotta migrate` says so in its output, and `/api/workspace` now carries `notices`
  that the board renders above everything else — naming which side it read, how many entities the
  other side has, and what closes the gap.

### Changed (earlier in this release)

- **The product is renamed A-Team → Kotta (D-005, D-006, D-007), and the rename costs an existing
  workspace nothing.** The npm package is now `kotta` (0.3.0) and the old `@arpadtamasi/a-team` is
  deprecated in favour of it; the CLI binary is `kotta`, with `a-team` installed as an alias of the same
  entrypoint reporting the same version. `.kotta/` is the workspace directory: `kotta init` creates it,
  discovery finds it first, and it is what the status output and the board header show. A workspace
  under the pre-rename name is still discovered and used as-is, so no repository has to migrate; when
  one wants to, `git mv` plus a backwards symlink keeps history and old scripts intact, and a symlinked
  name always loses to a real sibling so Git plumbing keeps reading the tracked tree. Two real
  directories are the one ambiguous case: the CLI uses `.kotta/` and prints a warning naming the
  directory it ignored. `init` refuses to add a second workspace beside an existing one under either
  name. Environment overrides are `KOTTA_*`, with the `A_TEAM_*` names still read. Documentation, the
  site (now published at `arpadtamasi.github.io/kotta/`), the schemas and the skills carry the new name;
  `/setup-a-team` and `/report-a-team-bug` are now `/setup-kotta` and `/report-kotta-bug`. The README
  section "Renamed from A-Team" is the single description of the compatibility. Behaviour is otherwise
  unchanged: this release renames, it does not change what any command does.

- This repository migrated its own workspace to `.kotta/` (T-021) with `git mv` and a committed
  `.a-team → .kotta` symlink — the first instance of the documented migration, and the model the
  remaining Kotta-using projects follow. All 118 workspace files moved with their history; the
  `index.md merge=union` attribute moved with them.

- Entity identifiers are minted without coordination (T-034, D-003 narrowed by D-010): `ticket new`,
  `finding new`, `package new` and `decision create` produce `<type>-<ULID>` instead of scanning the
  branch for `max + 1`, so two agents on two branches can no longer be handed the same id. New entity
  files are named `slug-<short id>.md`; the generated `index.md` is merged with Git's `union` driver,
  which `kotta init` now records in `.gitattributes` for the workspace directory it created. Existing sequential identifiers, filenames and
  references are untouched and stay valid indefinitely — `validate` accepts both forms and reports
  `DUPLICATE_ID` if two entities ever share one.

### Added

- `a-team package close <id> --approve`: a package whose member tickets all reached `done` can be
  completed from any package state, so a package is no longer stuck in `backlog` when its tickets were
  executed one by one instead of through `package start`. Automatic completion now covers every
  unfinished package state as well — closing or cancelling the last member ticket finishes a package
  that never went `active`. `close` refuses while a member ticket is not `done`, names that ticket and
  changes nothing, never edits a ticket, and is a no-op on an already finished package. Coordinator
  branch cleanup stays with `package finalize`.
- `a-team ui` opens the served URL in the default browser once the server is listening
  (T-01kz1g2vyhfn5ezzvvyzn4w2gr), including a port picked by the 4311 fallback, so the printed URL no
  longer has to be copied by hand. `--no-open` suppresses it, `--json` never opens because that mode is
  for automation, and a failed handover is a warning that leaves the server and the exit status alone.
- `a-team ticket execute <id> --agent <agent>` (T-035, D-009): one command performs the start, assembles
  the brief and launches the agent with the brief as its only input, so per-ticket fresh context is the
  default path instead of coordinator discipline. It refuses before any mutation on a non-ready ticket, an
  existing claim or execution context, a dirty repository and a missing agent command; a non-zero exit or an
  empty result is reported as `agent-failed` with the claim and worktree preserved; an interrupt terminates
  the agent and names the manual decision. `--resume` reuses the existing execution context (retry, or a
  context created by `ticket start`) and `--inherit-context "<reason>"` is the explicit, logged exception to
  the fresh-context default. The output — human and `--json` — names the brief's token count, the agent, the
  branch and the worktree, and `ticket start` now names `ticket execute` as its next step.
- Initial installable skill collection for setup, ticket definition and execution, finding validation, package coordination, review submission, and safe ticket closure.
- Repository-native workflow model for tickets, packages, findings, profiles, and claims.
- Canonical CLI contract shared by skills, automation, and the future local UI.
- Git isolation rules for feature branches, claims, protected branches, and parallel worktrees.

### Fixed

- `decision create` no longer fails with `ENOENT` in a freshly created worktree (T-01kz1g2vra99x0xhw144x6rke4). Git does not
  carry the empty `decisions/` workspace directory into a linked worktree, so the writer now creates it
  before reading, the way every other writer already does. Nothing about a decision's content or id
  derivation changes.

- An entity a merge left in two state directories is now a named failure with a supported way out
  (T-036, the second root of F-008). `validate` reports it as `DUPLICATE_STATE`, listing every place
  the id was found, and no longer conflates it with a genuine `DUPLICATE_ID` collision inside a single
  directory. `a-team ticket dedupe <id> --approve` and `a-team package dedupe <id> --approve` resolve
  it deterministically: the furthest-advanced lifecycle copy is kept, the earlier ones are removed
  through the CLI (no manual `git rm`) and named in the output together with the frontmatter fields
  that differed. The resolution never runs without `--approve`, and it stops instead of choosing when
  the two copies' bodies differ.

## [0.2.2] - 2026-07-27

### Added

- Entity detail drawer in the local UI: clicking a ticket, finding, or package opens a drawer that renders its full contract and metadata from the workspace data, with clickable entity links and Discuss / Raw source actions (T-017).
