# Kotta

Kotta is a repository-native operating system for human–AI development teams.

It provides executable contracts, type-specific requirements, coordinated work batches, and strict Git isolation for coding agents—all stored as plain files in your repository.

> Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.

[See why Kotta exists and follow the visual onboarding guide.](https://arpadtamasi.github.io/kotta/)

## Install and create your first contract

Prerequisites: Node.js 20 or newer, Git, and a coding-agent host that reads skills from
`~/.claude/skills`. The guided slash-command path is verified with Codex; other hosts may expose
installed skills differently.

Install the public CLI and confirm the exact version:

```bash
npm install --global @arpadtamasi/kotta@0.6.0
kotta --version
```

The binary is `kotta`. The pre-rename name `a-team` is installed as an alias of the same
entrypoint and reports the same version, so existing scripts keep working; new work should
use `kotta`. See [Renamed from A-Team](#renamed-from-a-team) if you already have a workspace.

Install the skills that ship with the CLI. They go into the host's skill directory, so one run
covers every project and every linked worktree, and the version always matches the CLI you just
installed:

```bash
kotta sync
```

`kotta init` does this too, so a new project needs one command rather than two. Run `kotta sync`
again after upgrading Kotta; `kotta status` says when an installed skill no longer matches the
shipped one. A skill belonging to another tool under the same name is left alone and reported,
never overwritten.

The same two commands also write `.kotta/AGENTS.md`: the rules every agent working in the project
must follow, with the install command above rendered from the package actually running, so an agent
that arrives without the CLI can find out where it comes from. That file is Kotta's — `sync` keeps
it current, and reports it as drifted rather than replacing a copy you edited.

Your own `AGENTS.md` stays yours. Kotta changes it only when you ask:

```bash
kotta sync --link-agents     # links `@.kotta/AGENTS.md` after explicit human approval
```

For a normal project file this appends only the pointer. For an older `AGENTS.md` that starts with
Kotta's copied inline rules and has Kotta's explicit `## This repository` ownership boundary, it
replaces the obsolete Kotta prelude with the pointer and preserves that project section byte for
byte. A similar-looking file without the complete legacy structure is never shortened. Running the
command again is a no-op, and a file that already refers to `.kotta/AGENTS.md` is left alone.
Without the flag nothing outside `.kotta/` is written.

Connect Kotta to the project-scoped Codex chat once, then start a new chat (or restart the host) so
the MCP tools are discovered:

```bash
kotta integrate codex
```

After that, create, define, validate, start and review contracts by asking in the calling chat.
Kotta returns identifiers as structured tool results and presents sign/close/change-request
decisions as scoped host-chat prompts; the human does not relay ids or run lifecycle commands.

Then open an existing Git repository in the supported host and run:

```text
/setup-kotta
/define-contract
```

`/setup-kotta` invokes the canonical `kotta init` operation and creates the local
`.kotta/` workspace and connects the caller-chat tools. `/define-contract` guides you through an
executable work contract. The calling agent checks the generated contract and workspace through
Kotta's structured tools; the equivalent terminal commands remain available for recovery:

```bash
kotta contract validate <contract-id>
kotta validate
kotta status
```

Every command that creates an entity prints its identifier. New identifiers are minted
without coordination — `T-` plus a time-sortable ULID — so two agents on two branches can
never mint the same one, and their branches merge without renumbering. Identifiers created
before this rule (`T-034`, `F-008`, `P-005`, `D-003`) keep their sequential form forever; a
workspace with both kinds is valid and stays that way.

With Node, Git, and Codex already installed, this path is designed to take no more than five
minutes; the release canary records the measured result.

If `kotta` is not found, inspect `npm prefix --global`, ensure its `bin` directory is on
`PATH`, and reopen the terminal. If validation fails, read the reported missing section or
profile requirement, update the contract through `/define-contract`, and rerun both validation
commands. The CLI never treats a validation failure as a defined contract.

## Renamed from A-Team

The product was called **A-Team** until 2026-08 (D-005, D-006, D-007). This section is the one
place that compatibility is described; nothing else in the repository restates it.

| Surface | Now | Pre-rename name |
| --- | --- | --- |
| npm package | `@arpadtamasi/kotta` | `@arpadtamasi/a-team` (deprecated, points here) |
| CLI binary | `kotta` | `a-team` — still installed, same entrypoint, same version |
| Workspace directory | `.kotta/` — what `kotta init` creates and what discovery finds first | the pre-rename directory — still discovered and used as-is |
| GitHub repository | `arpadtamasi/kotta` | `arpadtamasi/a-team` (redirects) |
| Environment overrides | `KOTTA_*` | `A_TEAM_*` — still read |

Directory discovery is one rule: **the new name if it is there, the old one otherwise.** The CLI
never renames a workspace behind your back, and `init` refuses to create a second one beside an
existing directory under either name. Nothing forces you to migrate; a pre-rename workspace keeps
working untouched for as long as the compatibility read stays (its removal is a separate, later
decision).

### Migrating a workspace

**One command does it: `kotta migrate`.** It carries a workspace from any older shape to the current
one — the workspace directory, the entity directories, the stored statuses, the frontmatter field
names and the config file — and it is the only reader of the old shape. See
[Migrating the vocabulary](#migrating-the-vocabulary) below; the directory rename is one of the steps
it performs.

Doing the directory move by hand is still possible, and it is what this repository did before the
command existed:

```bash
git mv .a-team .kotta
ln -s .kotta .a-team
```

`git mv` keeps every blob and every rename detectable, so `git log --follow` still reaches back
through the old path. The committed symlink keeps pre-rename scripts, bookmarks and older `a-team`
installs resolving against the same files. Move the `index.md merge=union` line in `.gitattributes`
to the new path at the same time.

The bridge works in either direction — `ln -s .a-team .kotta` lets an unmigrated workspace answer
to the new name too. Only one of the two is ever a real directory, and that is the one Git tracks
and the board reads through Git plumbing; a symlinked name always loses to a real sibling, so both
directions resolve to the same files.

On Windows, a checkout without symlink support materialises the committed link as a small regular
file rather than a link. That is harmless: discovery prefers the real directory, so the CLI and the
board still read the migrated workspace. Only scripts that reach through the old path break, and
they break visibly.

If both names are real directories — two separate workspaces, not a bridge — the CLI uses `.kotta/`
and prints a warning naming the directory it ignored. Merge them and replace the leftover with a
symlink; the warning is not a state to live in.

## Migrating the vocabulary

The entities are **observation**, **contract** and **batch**, and the state between backlog and
active is **defined** (D-01kz240dn155hb97h6px6n2p85). Workspaces written before that carry the older
words — `findings/`, `ready/`, `packages/`, a `package:` field, a batch `kind` — and no command
except one reads them:

```bash
kotta migrate --dry-run    # every change it would make; writes nothing
kotta migrate              # the same list, applied
```

What moves:

| Old | New |
| --- | --- |
| `.a-team/` | `.kotta/` |
| `ready/`, `findings/`, `packages/` | `defined/`, `observations/`, `batches/` |
| `status: ready` | `status: defined` |
| a contract's `package:`, `source_finding:` | `batch:`, `source_observation:` |
| a batch's `tickets:`, `kind:` | `contracts:`, removed |
| an observation's `finding_type:`, `ticket:` | `observation_type:`, `contract:` |
| a claim's `ticket:` | `contract:` |
| `config.yaml` `packages:`, `version: 1` | `batches:`, `version: 2` |

**Identifiers never move.** No id, no filename and no reference *value* changes — this is vocabulary,
not identity (D-010). The command compares the id set before and after and refuses to lose one.

It is idempotent and safe to interrupt: every step is derived from what is on disk rather than from a
progress marker, so a second run reports "already on the current shape" and a partial run is finished
by running the command again. Every other command refuses a pre-vocabulary workspace with an error
that names `kotta migrate`; there is no compatibility layer behind that refusal on purpose.

**Commit the migration before you read the board.** `kotta ui` reads the workspace from the configured
base ref through Git plumbing, not from the working tree, so a migration that has not reached that ref
yet shows the right header path above no content at all. The command says so when it finishes, and the
board carries the same notice until the gap closes.

## How it works

The repository filesystem is the source of truth. Contracts move through a deliberately small lifecycle:

```text
backlog → defined → active → review → done
```

- Contracts define an observable outcome, bounded scope, acceptance conditions, and verification.
- Work that should not continue leaves through `kotta contract cancel <id> --resolution <resolution>
  --reason "…" --approve`, from any state before `done`. `close` is for work that was finished and
  merged; `cancel` is for work whose purpose is gone — superseded by a decision, duplicated by
  another contract, or abandoned. `duplicate` and `obsolete` also require `--superseded-by <id>`
  naming the contract or decision that took its place, so the record says what killed the work and
  not only that it ended. Cancelling releases the claim and removes the execution worktree; the
  branch is preserved, because a cancelled branch was never merged.
- Profiles add work-specific requirements for bugs, UI, performance, workflows, metrics, refactors, and discovery.
- Batches coordinate sprints, milestones, batches, or missions with sequential, parallel, or dependency-aware execution.
- A batch may also group other batches, so a large product has a level above the contract. That
  nesting is grouping only: a child batch has no coordinator branch and no execution of its own, and
  `kotta batch start` runs a leaf, never a parent. Reading a parent — `kotta batch status <id>` —
  reports every contract in its subtree in dependency order, which is what lets you ask an agent in
  chat to carry out a whole parent. Every contract in it still passes its own human gates.
- Observations capture possible bugs and technical debt without silently expanding active work.
- Claims connect each active contract to one agent, one feature branch, and one isolated implementation worktree.

Live lifecycle state, claims, decisions, visible chat and approval events stay on the configured base
branch (`main` by default). Feature worktrees contain implementation code without a competing active,
review or done copy. Contract execution lifecycle, claim, execution-outcome, discovered-work and
chat/approval writers are serialized by a repository-wide mutation lock. The configured base branch
must remain checked out in one linked worktree; commands invoked from another worktree route these
mutations there and refuse rather than writing live state into a feature branch when it is missing.

That requirement applies to repositories with several worktrees. Where there is exactly one checkout,
it is the control plane on whatever branch it holds — a hosted agent session gets one checkout on a
branch of its host's choosing, and a solo developer may never make a second worktree. In that shape,
if the branch is not a protected one, `contract start` adopts it rather than creating a second branch
and worktree, and records on the claim that it created neither; `close` and `cancel` then leave that
branch and checkout exactly where they found them. On a protected branch there is nothing to adopt,
so Kotta names and creates as usual, which is what keeps execution off it. The name comes from
`git.branch_pattern`.

The calling agent host is the primary human approval surface. `kotta mcp` exposes structured tools;
`approval_request` prepares one exact entity-scoped transition, interrupts the current chat with an
approve/reject/cancel form, records the visible human response, and only then calls the same
validated mutation service as the CLI. A failed application is durable and never masquerades as a
successful transition. `kotta integrate codex` adds the project-scoped MCP configuration
idempotently. The CLI remains the human-operated recovery and terminal-first fallback.

The caller can persist exact visible human and assistant messages through the MCP conversation tool;
Kotta never stores hidden reasoning, raw tool output or transient streaming deltas. Restarting
`kotta ui` reconstructs the same read-only contract timeline from `.kotta/events/`; [the event
schema](schemas/event.schema.json) defines the stored format.

Open the local filesystem-backed board from an initialized repository:

```bash
kotta ui
```

The board is deliberately read-only: it serves canonical state and history through GET requests and
rejects every mutation endpoint. Actions and approvals stay in the calling chat.

This uses the current directory by default. To serve another checkout or address its
workspace directly, pass `--workspace <repository-root>` or `--workspace <repository-root>/.kotta`.

Without `--port`, the board starts at `4311` and advances to the next free port when that
one is taken, so a second workspace opens without any manual step; the output names the
port it selected. With an explicit `--port <port>` the choice is strict: an occupied port
fails with an actionable error instead of quietly moving to a neighbour.

Once the server is listening, the selected URL is opened in the default browser. `--no-open`
prints it without opening, and `--json` never opens anything because that mode is for
automation. A browser that refuses to open is a warning, never a startup failure — the board
keeps serving.

## Batch coordinator branches

`kotta batch start` runs a batch on a deterministic coordinator branch, `coord/<batch-id>`.
Started from the configured base branch it creates a dedicated linked worktree at
`.worktrees/batches/<batch-id>` and checks the coordinator branch out there, leaving the control
checkout on the base branch. The batch records the coordinator branch, worktree, base branch and
base commit. Starting again reuses the recorded coordinator worktree; a missing worktree or an
unrelated control checkout is refused rather than guessed.

Every contract dispatched by `batch start` branches from the coordinator's current commit, not the
control checkout's `HEAD`. The command prints the symbolic start ref and exact resolved commit for
each new worktree, and the same baseline is retained in the claim and lifecycle history.

Dependency-aware execution has a technical handoff rule distinct from acceptance. A dependency is
ready for another member of the same batch when it is `done`, or when it is in `review` and Git proves
its feature branch is an ancestor of the coordinator commit. Review alone never unlocks a wave, and
`contract start` outside `batch start` still requires every dependency to be `done`. Dispatching the
next wave does not close or approve its predecessor: `review → done` remains the separate human gate.

Completing the last contract does **not** delete the coordinator branch — its final commit is what
gets integrated. `kotta batch status <id>` reports where the batch stands: `active`,
`done-unintegrated`, `cleanup-pending`, `blocked-*`, or `cleaned`.

Completing the last member contract also completes the batch itself, whether or not the batch was
ever started — a batch whose contracts ran one by one through `kotta contract execute` is finished by
the last `contract close` or `contract cancel`, not left in `backlog`. `kotta batch close <id> --approve`
is the explicit path for a batch whose contracts reached `done` some other way: it moves the batch to
`batches/done` from any state, refuses while a member contract is not `done` and names it, never touches
a contract, and is a no-op on an already finished batch.

Once the branch is merged, `kotta batch finalize <id>` performs the cleanup, and only what it
can prove is safe: it verifies by Git ancestry that the coordinator head is contained in the base
branch or its remote-tracking ref, fast-forwards the control checkout when needed, removes the clean
coordinator worktree, and deletes the merged local branch with `git branch -d`. A dirty worktree, an
active claim, a linked contract worktree, a branch held by another worktree, or a diverged base each
stop it with an explanation and change nothing. It never forces, resets, rebases, or deletes a remote
branch, and re-running it after success is a no-op.

## Core safety rules

- A backlog item is not executable until it is valid and explicitly defined.
- An observation is not automatically a contract.
- Agents do not invent missing product intent or accepted trade-offs.
- Every active contract has at most one claim and one feature branch.
- Parallel execution uses separate Git worktrees.
- Execution never edits a protected branch.
- Review requires acceptance-to-evidence mapping.
- Closing requires accepted review, integration, and verified acceptance.
- Unsafe branch or worktree cleanup is refused.

## Skills

- `explore-workspace` — answer cross-workspace questions about themes, related work, overlaps, decisions, and backlog structure without changing PM state.
- `setup-kotta` — initialize a project workspace.
- `define-contract` — investigate and formalize work.
- `validate-observation` — verify and disposition discovered work.
- `start-contract` — safely claim and isolate a defined contract.
- `execute-contract` — implement one bounded contract.
- `execute-batch` — coordinate a batch of contracts.
- `submit-review` — submit implementation with evidence.
- `close-contract` — verify completion and safely release resources.
- `report-kotta-bug` — prepare and, after explicit approval, submit a Kotta defect report as a GitHub Issue.
- `consolidate-model` — find where one concept lives under several names across code, docs and wire, and propose consolidations in chat. Creates nothing.

## Report a bug

Defects in Kotta itself go to
[the issue form in `arpadtamasi/kotta`](https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml).
The same destination and the same report contract serve every entry point:

- **Public site** — the `Report a bug` link in the header and footer of the onboarding site.
- **Local board** — the `Report a bug` link in the rail footer of `kotta ui`. The board sends
  nothing itself; it opens the GitHub form so you write and submit the report there.
- **Coding agent** — the installed `report-kotta-bug` skill. It inspects evidence, searches
  open issues for duplicates, sanitizes the draft, and shows you the exact repository, title,
  body, and diagnostic fields before asking to create the issue. Without approval nothing is
  sent. With an authenticated GitHub connector or `gh` session it creates the issue and returns
  its URL; without one it returns the complete report as copyable Markdown plus the form URL.

Every path reports the same five fields: summary, reproduction steps, expected behaviour,
actual behaviour, and Kotta version. Optional diagnostics (Node.js and OS version, the
redacted failing command output, the redacted `--json` error payload) are off by default and
require a separate per-report opt-in after the exact fields are shown. Kotta stores no GitHub
credential, and reporting never mutates your `.kotta` workspace.

Maintainers capture an incoming issue as evidence, not as scheduled work:

```bash
kotta observation new --title "<issue title>" --type bug \
  --evidence "https://github.com/arpadtamasi/kotta/issues/<n> — <reported facts>"
```

The observation stays open until `kotta observation validate` and a human-approved
`kotta observation resolve --disposition <disposition> --approve`. A GitHub Issue never creates a
contract by itself.

## CLI overview

```bash
kotta init
kotta migrate --dry-run
kotta migrate
kotta validate
kotta status

kotta contract new --title "Add filtered export" --type feature --profile ui workflow
kotta contract define T-014 --from /tmp/T-014-definition.md
kotta contract validate T-014
kotta contract sign T-014 --approve
kotta contract start T-014 --agent codex
kotta contract start T-014 --agent codex --caller
kotta contract brief T-014 --out /tmp/T-014-brief.md
kotta contract execute T-014 --agent claude
kotta contract execute T-014 --resume
kotta contract review T-014 --evidence "Acceptance tests and visual evidence passed" --pull-request PR-123
kotta contract close T-014 --approve

kotta batch validate P-012
kotta batch sign P-012 --approve
kotta batch start P-012 --agent codex
kotta batch status P-012
kotta batch close P-012 --approve

kotta observation new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
kotta observation validate F-032
kotta observation resolve F-032 --disposition create-contract --approve

kotta decision create --from /tmp/cutover-decision.md --approve

kotta claim list
kotta claim release T-014 --force

kotta contract list --state review
kotta observation list --state new
kotta decision list
kotta batch list

kotta contract show T-rf5d4tfp
kotta observation show F-01kz9d5nqwdwb7r2c0jdzchspa
```

`show` answers the other half — one entity as it is stored, its state, its set facts and its body — and is deliberately not `contract brief`: the brief assembles the execution package for an agent about to implement, and exists for contracts alone. **The id the CLI prints is the id the CLI accepts:** the short form shown in every listing resolves on every command that takes an id, and an ambiguous short form is refused naming the full ids it matched rather than guessing between them.

`list` answers "what is in this workspace" for every entity, with the title first and the id after it, and narrows with a repeatable `--state`. It is read-only and deterministic: the same workspace lists the same bytes, and nothing — not even the index — is written. The same four listings reach the calling chat as read-only tools, so an agent orienting itself never has a reason to read `.kotta/` directly.

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

Before a contract can be signed, its `Open decisions` section must say that no decision remains.
Kotta accepts `None`, `None.`, `N/A`, `N/A.`, `No open decisions` and `No open decisions.`
case-insensitively; real unresolved choices still keep the contract in backlog.

**Small contexts by default.** Each contract executes in a fresh agent context whose intent input is `kotta contract brief <id>` — the contract body, its referenced decisions, its profiles and its claim, nothing else. The brief is deterministic and reports an approximate token count; above a threshold (`--warn-tokens`, default 12000) it warns that the contract is probably too large or under-referenced. This is a quality gauge, not a thrift trick: if a contract cannot be executed from its brief plus the code in the worktree, the contract is incomplete — record the gap instead of widening the context.

**`contract execute` is the command that makes that the default (D-009).** `kotta contract execute <id> --agent <agent>` does the start, assembles the brief and launches the agent with the brief as its only input — the caller's context never reaches it. It refuses before creating anything when the contract is not defined, a claim or execution context already exists, the repository is dirty, or the agent command is missing, so a missing binary can never leave a half-built worktree. The output — human and `--json` — names the brief's token count, the agent, the branch and the worktree; record the token count per contract in the run log.

When continuity matters more than isolation, `kotta contract start <id> --agent <agent> --caller`
creates the same branch, claim and worktree but labels the run `inherited`. The current caller then
continues inside the returned worktree. This is explicit and opt-in; fresh brief-only execution stays
the default, and persisted chat is never injected wholesale into a fresh executor.

A non-zero exit or an empty result is `agent-failed`: the claim and worktree are kept for inspection and the contract does not move to review. An interrupt terminates the agent, keeps the claim and worktree, and names what to decide by hand. Retry with `kotta contract execute <id> --resume`, which reuses the existing execution context (and is also how a context created by `contract start` gets its agent) — a second plain `execute` always refuses rather than starting a second agent. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"` requires a reason, appends it to the prompt as a declared deviation and reports it in the output.

**The record is derived from the run, not from the agent.** `execute` captures the worktree's baseline — the contract branch tip and its porcelain status — before it launches, and compares afterwards. An agent that exits 0 and talks about work it never did is recorded as `no-change`, not `implemented`; commits and uncommitted changes both count as `implemented`. Each run appends one execution event carrying the resolved state, the agent, the baseline and resulting commit, whether uncommitted changes remain, the exit code, and the agent's own printed output — stored as reported, never promoted into the state decision. A resume appends a new record instead of rewriting the previous one, updates the claim when it names a different agent, and unrelated dirt in the control worktree can no longer discard a completed run's record.

The agent binary is resolved from `--agent` (`claude`, `codex`, or any command on `PATH`); `KOTTA_AGENT_COMMAND` overrides the executable, which is how the test suite drives a deterministic script double instead of a real agent. Review, merge and close stay separate human gates — `execute` never enters them.

**What a launched agent may do is the operator's decision, not Kotta's.** `agents.permission_mode` in `.kotta/config.yaml` is passed to the agent as `--permission-mode`; with nothing set — the shipped default — Kotta passes no flag at all and the agent's own project settings decide, so a launched run never receives authority the caller had not already granted. That default is safe rather than convenient: `claude -p` asks before it writes and a headless run has nobody to answer, so an unconfigured run may complete having changed nothing. `execute` says so at launch, and the baseline comparison then records it as `no-change` rather than as an implementation. Setting a mode that permits writes — `acceptEdits`, or `bypassPermissions` for a fully autonomous run — is a deliberate act, made once, visible in the workspace config and revocable there. A mode that forbids edits by definition (`plan`) is refused at launch naming the cause, because a planning run cannot implement a contract.

A decision draft contains `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. `decision create` requires explicit human approval, assigns the
next stable `D-001`-style identifier and current date (or validates supplied values), and
atomically publishes the validated record beneath `.kotta/decisions/`. Pass `--id D-001`
when a caller needs to reserve a specific stable identity; an existing identity is never
overwritten. The canonical filename is the identity alone (`D-001.md`), so different
titles cannot race around the identity reservation.

## Tests

`npx vitest run` runs the whole suite in one command. `tests/unit` and `tests/integration`
cover the CLI and run in Node. `tests/ui` holds component tests for the React board: they
render a real component from `ui/src/` with `@testing-library/react` in `jsdom`, and assert
what the user sees plus how the surface reacts to a click or an input. No browser is started —
`site/tests` is the separate Playwright suite, run with `npm run test:site`.

To add a UI test, copy [`tests/ui/done-stage.test.tsx`](tests/ui/done-stage.test.tsx). The
first line, `// @vitest-environment jsdom`, is what puts that file in a browser-like
environment; everything without it stays in Node, so a CLI test can never drift into `jsdom`.
Export the component you want to render from `ui/src/App.tsx` and keep the fixture local to
the test.

## Maintainer releases

`package.json#version` is the only release version source. Merge a reviewed version bump to
`main`, then create `v<version>` on that exact commit. The `npm release` workflow rejects a
tag/version mismatch or a commit outside `main`, runs the full tests, inspects the packed
allowlist, and exercises a clean install before publishing.

### The first release under the scoped package name

The CLI was renamed with 0.3.0. npm rejected the unscoped `kotta` package name as too similar to
existing packages, so the public package is `@arpadtamasi/kotta`; its installed executable remains
`kotta`. A package that does not exist yet on the registry has no trusted publisher configured, so
the **first** scoped release is published by a maintainer by hand, from a clean `main` checkout at
the release commit:

```bash
npm run verify:pack                  # build, pack, inspect the allowlist
npm publish --access public --provenance=false
```

Then point the old batch at the new one, once:

```bash
npm deprecate @arpadtamasi/a-team "Renamed to '@arpadtamasi/kotta'. Install with: npm i -g @arpadtamasi/kotta"
```

Afterwards configure Trusted Publishing for `@arpadtamasi/kotta` on npmjs.com (repository
`arpadtamasi/kotta`, workflow `.github/workflows/npm-release.yml`, environment `npm-release`);
every later release goes back through the tag-driven workflow below and needs no local publish.

Publishing is limited to the `arpadtamasi/kotta` repository, `.github/workflows/npm-release.yml`,
and the `npm-release` GitHub environment through npm Trusted Publishing. The workflow receives
only `contents: read` and `id-token: write`; ordinary pushes and pull requests have no npm
credential. Published versions are immutable. If a version already exists or a post-publish
canary fails, correct it with a new patch version rather than attempting an overwrite.

## Scope

Kotta is intentionally local and file-based. V1 has no hosted service, database, authentication, automatic prioritization, automatic merging, scheduler daemon, or Jira/Linear synchronization.

## License

MIT. See [LICENSE](LICENSE).
