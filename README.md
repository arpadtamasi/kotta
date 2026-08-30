# Kotta

Kotta is a repository-native operating system for human–AI development teams.

It provides executable tasks, type-specific requirements, coordinated work batches, and strict Git isolation for coding agents—all stored as plain files in your repository.

> Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.

[See why Kotta exists and follow the visual onboarding guide.](https://arpadtamasi.github.io/kotta/)

## What Kotta is for

Your profession spent forty years learning how to say exactly what it wants. Use cases. Acceptance
examples. Quality scenarios. A glossary that holds. A trace from every requirement to the thing that
proves it.

Then it stopped doing almost all of it, for one reason: writing it down cost more than writing the
code.

That reason is gone. You are not the one writing the code any more, and what you write down is what
executes. The specification just became the most valuable file in your repository — and most teams
do not have one.

Kotta is where you keep it, plus the rule that keeps it honest. Spec tools generate that file and
hand it to your agent as advice. Here it is a contract: a task cannot be defined until every
acceptance condition names the specification node it came from, it cannot enter review until every
condition is mapped to evidence, and it cannot close until you approve — and every approval leaves
a receipt naming who accepted what, and when. Your agent does not get to decide it is done.

Three nouns, one loop. The **specification** says what must be true. The **code** is the
implementation. A **task** connects them. An **observation** carries back what the running system
says, so what you noticed gets dispositioned on purpose instead of folded silently into whichever
task happened to be open.

The vocabulary, none of the ceremony. One human gate per task by default, at close — rejecting a
review is its own decision with its own receipt. Plain files in the repository you already have.

## Where it fits

For developers and technical leads running coding agents against a repository that already exists.
Three ways in, and they are three entries into the same loop.

**Starting something new.** `spec → task → code`

You have an idea, not a specification, and you are not going to write one in Word. Run the
workshops as conversation — impact mapping, example mapping, quality scenarios — and each one lands
Markdown nodes in `.kotta/spec/`. Agree one node and a task defined against it can execute the same
hour.

> A goal node says bookings never double-book a room. An example node states the overlapping
> reservation that would prove it. The task that implements booking names that example in its
> acceptance, so review has to produce evidence for that exact case before anyone can close it.

**Rewriting a legacy system.** `code → spec → task → code`

The code is the only specification you have, and it will not tell you which of its behaviour was
ever intended. Read it back out — event storming for the lifecycle, use-case modeling for the flows
you must keep, glossary terms for the words the old code overloads — and the rewrite finally has
something to be wrong against. From there it is the same loop as new work.

> A state-machine node records the order lifecycle the legacy code actually implements. The rewrite
> task maps every transition to a test. What you accept is the diff that proves the transitions —
> not the one that looks finished.

**Continuing a codebase you already have.** `running system → observation → spec → task → code`

Nobody is going to stop the world and specify it first. Kotta never asks you to: you write down
only the part you are about to touch. What the running system tells you — a defect, a gap, a promise
nothing keeps — is captured as an observation and dispositioned on purpose, so it either amends the
specification or becomes its own task, and never widens the one you are on. `kotta gap` names which
accepted promises still have no evidence, and which enforcement in the code has no specification
behind it.

> Before changing export, record the business rule the export has to obey. The task that changes it
> names that rule. The next agent that touches export finds the rule instead of guessing at it.

**The agreement changes.** `changed intent → amended spec → task → code`

The stakeholder moves, the market answers, a decision expires. This is where the spec starts paying
rent: impact analysis walks the graph from the changed node to everything that cites it, `kotta gap`
leads its next report with the amended nodes so what you now owe evidence for is the first thing you
see, and work the change made pointless leaves through `cancel` — naming what superseded it.

> A pricing rule changes. The traceability report names every example, use case and task that cites
> the old rule; you amend the node, and the obsolete task is cancelled with the record saying which
> decision killed it — not merely that it ended.

## What you get

- **Tasks that execute** — outcome, scope, acceptance and verification, run by one agent on one
  branch in one isolated worktree.
- **Acceptance that traces** — every condition names the specification node it came from, or the
  task does not become defined.
- **Evidence, then a human** — review maps each condition to reproducible evidence; `review → done`
  is your decision, and Kotta records who decided what and when.
- **Batches** — dependency-aware waves for work bigger than one task, with nesting above it.
- **Observations** — park what you noticed without widening what you are doing.
- **Plain files** — Markdown and Git history. `kotta ui` shows it read-only; nothing is hidden
  behind a service.

## What Kotta is not

Kotta does not write your code, and it never will. It is the control layer around the agents that
do: keep your chat, your runtime and your issue tracker, and Kotta keeps the agreement and the one
legal path to completion. It is not a spec generator either: the workshops draft with you,
question by question, and nothing they draft governs anything until a task cites it and a human
accepts the evidence. Writing the specification is the conversation's job; holding everyone to it
is Kotta's.

Kotta is intentionally local and file-based. V1 has no hosted service, database, authentication, automatic prioritization, automatic merging, scheduler daemon, or Jira/Linear synchronization.

If you want a hosted board, an automatic merge queue, or a tool that decides what to build next,
Kotta is the wrong layer.

## Install and create your first task

Prerequisites: Node.js 20 or newer, Git, and a coding-agent host that reads skills from
`~/.claude/skills`. The guided slash-command path is verified with Codex; other hosts may expose
installed skills differently.

Install the public CLI and confirm the exact version:

```bash
npm install --global @arpadtamasi/kotta@0.11.1
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

The public site shows `npx skills@1.5.20 add arpadtamasi/kotta` for hosts that use the shared
skills installer; `kotta sync` installs the same skills and also writes the workspace rules file
below. `kotta init` does this too, so a new project needs one command rather than two. Run
`kotta sync` again after upgrading Kotta; `kotta status` says when an installed skill no longer
matches the shipped one. A skill belonging to another tool under the same name is left alone and
reported, never overwritten.

Connect Kotta to the project-scoped Codex chat once, then start a new chat (or restart the host) so
the MCP tools are discovered:

```bash
kotta integrate codex
```

After that, create, define, validate, start and review tasks by asking in the calling chat.
Kotta returns identifiers as structured tool results. A covered definition becomes executable
without re-asking the agreement already accepted in the spec; close and change-request decisions
remain scoped host-chat prompts. The human does not relay ids or run lifecycle commands.

Then open an existing Git repository in the supported host and run:

```text
/setup-kotta
/define-task
```

`/setup-kotta` invokes the canonical `kotta init` operation and creates the local
`.kotta/` workspace and connects the caller-chat tools. `/define-task` guides you through an
executable work task. The calling agent checks the generated task and workspace through
Kotta's structured tools; the equivalent terminal commands remain available for recovery:

```bash
kotta task validate <task-id>
kotta validate
kotta status
kotta gap
```

`kotta gap` is the one read that refuses. An accepted specification node either has evidence — code,
a test or a command definition naming its id — or its frontmatter admits an implementation gap and
says why. A node that is neither makes the command name it and exit non-zero, so a promise cannot
stay unaccounted for by nobody having looked. The report still prints in full when it refuses; that
is why the command is run. Admitting a gap does not dispose of a promise, and the wording is the
whole value: it records that the promise stands and is not yet kept.

```yaml
accepted:
  - "unimplemented: the exporter ships after the policy workshop; nothing implements this yet"
```

An admission says which of three situations it is, and the report counts them apart, because one
word covering all three made the number unreadable. **structural** — many code sites realise the
promise and no single one would ever name it, which is the measurement's boundary rather than a
debt. **unexamined** — nobody has checked yet, the only kind that may honestly be written in bulk.
**unimplemented** — someone looked and it is not built, which is the number to read as debt. An
admission naming none of them is refused like an unadmitted promise.

Every command that creates an entity prints its identifier. New identifiers are minted
without coordination — `T-` plus a time-sortable ULID — so two agents on two branches can
never mint the same one, and their branches merge without renumbering. Identifiers created
before this rule (`T-034`, `F-008`, `P-005`, `D-003`) keep their sequential form forever; a
workspace with both kinds is valid and stays that way.

With Node, Git, and Codex already installed, this path is designed to take no more than five
minutes; the release canary records the measured result.

If `kotta` is not found, inspect `npm prefix --global`, ensure its `bin` directory is on
`PATH`, and reopen the terminal. If validation fails, read the reported missing section or
profile requirement, update the task through `/define-task`, and rerun both validation
commands. The CLI never treats a validation failure as a defined task.

### Agent rules and your own AGENTS.md

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

## How it works

The repository filesystem is the source of truth. Tasks move through a deliberately small lifecycle:

```text
backlog → defined → active → review → done
```

- Tasks define an observable outcome, bounded scope, acceptance conditions, and verification.
- Every acceptance condition explicitly maps to a referenced spec node that has landed on the
  control branch. A valid covered definition moves from backlog to defined; there is no separate
  sign gate, and no workspace setting adds one.
- A review that does not satisfy you is rejected through `kotta task reopen <id> --approve`: its
  own decision with its own receipt, the evidence section is cleared, and the task returns to
  `active` to come back through review.
- Work that should not continue leaves through `kotta task cancel <id> --resolution <resolution>
  --reason "…" --approve`, from any state before `done`. `close` is for work that was finished and
  merged; `cancel` is for work whose purpose is gone — superseded by a decision, duplicated by
  another task, or abandoned. `duplicate` and `obsolete` also require `--superseded-by <id>`
  naming the task or decision that took its place, so the record says what killed the work and
  not only that it ended. Cancelling releases the claim and removes the execution worktree; the
  branch is preserved, because a cancelled branch was never merged. A retired task is displayed by
  its resolution everywhere it is listed or shown, so abandoned work never reads as delivered work.
- Profiles add work-specific requirements for bugs, UI, performance, workflows, metrics, refactors, and discovery.
- Batches coordinate sprints, milestones, batches, or missions with sequential, parallel, or dependency-aware execution.
- A batch may also group other batches, so a large product has a level above the task. That
  nesting is grouping only: a child batch has no coordinator branch and no execution of its own, and
  `kotta batch start` runs a leaf, never a parent. Reading a parent — `kotta batch status <id>` —
  reports every task in its subtree in dependency order, which is what lets you ask an agent in
  chat to carry out a whole parent. Every task in it still passes its own human gates.
- Observations capture possible bugs and technical debt without silently expanding active work.
- Claims connect each active task to one agent, one feature branch, and one isolated implementation worktree.

Live lifecycle state, claims, decisions, visible chat and approval events stay on the configured base
branch (`main` by default). Feature worktrees contain implementation code without a competing active,
review or done copy. Task execution lifecycle, claim, execution-outcome, discovered-work and
chat/approval writers are serialized by a repository-wide mutation lock. The configured base branch
must remain checked out in one linked worktree; commands invoked from another worktree route these
mutations there and refuse rather than writing live state into a feature branch when it is missing.

That requirement applies to repositories with several worktrees. Where there is exactly one checkout,
it is the control plane on whatever branch it holds — a hosted agent session gets one checkout on a
branch of its host's choosing, and a solo developer may never make a second worktree. In that shape,
if the branch is not a protected one, `task start` adopts it rather than creating a second branch
and worktree, and records on the claim that it created neither; `close` and `cancel` then leave that
branch and checkout exactly where they found them. On a protected branch there is nothing to adopt,
so Kotta names and creates as usual, which is what keeps execution off it. The name comes from
`git.branch_pattern`.

The calling agent host is the primary human approval surface. `kotta mcp` exposes structured tools;
`approval_request` prepares one exact entity-scoped transition, interrupts the current chat with an
approve/reject/cancel form, records the visible human response, and only then calls the same
validated mutation service as the CLI. A failed application is durable and never masquerades as a
successful transition. `kotta integrate codex` adds the project-scoped MCP configuration
idempotently, recording the interpreter and entry point that are running rather than a bare command
name — a host spawns Kotta from a non-interactive shell, which loads no version manager and would
not find it on PATH. When a configuration already names a command that has since vanished, Kotta
says so and names the one that would work instead of reporting the host as configured. The CLI remains the human-operated recovery and terminal-first fallback.

The caller can persist exact visible human and assistant messages through the MCP conversation tool;
Kotta never stores hidden reasoning, raw tool output or transient streaming deltas. Restarting
`kotta ui` reconstructs the same read-only task timeline from `.kotta/process/events/`; [the event
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

## Workspace layout and ownership

Kotta keeps two sibling namespaces beneath `.kotta/`:

```text
.kotta/
  AGENTS.md  README.md  config.yaml  .kotta-generated.json
  spec/       # project-owned form registry and specification nodes
    forms/
    <form directory>/
  process/    # Kotta-owned lifecycle and execution records
    tasks/  observations/  batches/
    profiles/  claims/  events/  decisions/
    index.md
```

A form's `directory` is relative to `spec/`: `directory: goals` means
`.kotta/spec/goals/`. Projects may add forms and edit specification nodes without changing
TypeScript. Lifecycle mutations under `process/` still go through the CLI or MCP services.

Identifiers are minted by Kotta here too — a specification id is never typed by hand:

```bash
kotta spec new use-case --title "Export a report"
```

It reads the form from the registry and writes the node under that form's directory, in the
filename shape the form declares, carrying its minted id, its declared form, a section for every
required heading and a field for every outgoing edge — each with the edge's own registered
question beside it, saying which this node answers itself and which another node answers by
pointing at it. A form the project registered itself is served the same way, with nothing about
it compiled in; an unregistered name is refused by listing the forms there are. The calling chat
reaches the same operation as `spec_create`.

What it writes is a draft, and nothing is committed: a shaped node becomes the agreement when it
lands on the base branch on a human yes. Until it is filled in, `kotta validate` names each
unanswered section and edge with the form's own question — the scaffold and the validator are the
two halves of one authoring loop.

A specification id written into a node's text is a citation, and `kotta validate` refuses one that
resolves to nothing — naming the file, the id, and the heading it stands under. Resolving means a
specification node or a decision record; what counts as a citation comes from the registry, so a
form the project added is read without a code change. A reference that points at a node which does
not exist is worse than no reference, because it reads as an answer.

One entity is one stable file. Lifecycle state lives in the frontmatter `status` field alone, so
a transition is a one-line edit in place — a file never moves between directories, and two
branches that transition the same entity meet as an ordinary merge conflict on the status line,
never as a second copy.

A task is required when work executes a human-accepted product or deliverable commitment with
checkable acceptance conditions. Shaping, exploration, and specification can happen without a
task until the specification itself becomes the accepted deliverable or the work crosses into
execution.

## Batch coordinator branches

`kotta batch start` runs a batch on a deterministic coordinator branch, `coord/<batch-id>`.
Started from the configured base branch it creates a dedicated linked worktree at
`.worktrees/batches/<batch-id>` and checks the coordinator branch out there, leaving the control
checkout on the base branch. The batch records the coordinator branch, worktree, base branch and
base commit. Starting again reuses the recorded coordinator worktree; a missing worktree or an
unrelated control checkout is refused rather than guessed.

Every task dispatched by `batch start` branches from the coordinator's current commit, not the
control checkout's `HEAD`. The command prints the symbolic start ref and exact resolved commit for
each new worktree, and the same baseline is retained in the claim and lifecycle history.

Dependency-aware execution has a technical handoff rule distinct from acceptance. A dependency is
ready for another member of the same batch when it is `done`, or when it is in `review` and Git proves
its feature branch is an ancestor of the coordinator commit. Review alone never unlocks a wave, and
`task start` outside `batch start` still requires every dependency to be `done`. Dispatching the
next wave does not close or approve its predecessor: `review → done` remains the separate human gate.

Completing the last task does **not** delete the coordinator branch — its final commit is what
gets integrated. `kotta batch status <id>` reports where the batch stands: `active`,
`done-unintegrated`, `cleanup-pending`, `blocked-*`, or `cleaned`.

Completing the last member task also completes the batch itself, whether or not the batch was
ever started — a batch whose tasks ran one by one through `kotta task execute` is finished by
the last `task close` or `task cancel`, not left in `backlog`. `kotta batch close <id> --approve`
is the explicit path for a batch whose tasks reached `done` some other way: it moves the batch to
`batches/done` from any state, refuses while a member task is not `done` and names it, never touches
a task, and is a no-op on an already finished batch.

Once the branch is merged, `kotta batch finalize <id>` performs the cleanup, and only what it
can prove is safe: it verifies by Git ancestry that the coordinator head is contained in the base
branch or its remote-tracking ref, fast-forwards the control checkout when needed, removes the clean
coordinator worktree, and deletes the merged local branch with `git branch -d`. A dirty worktree, an
active claim, a linked task worktree, a branch held by another worktree, or a diverged base each
stop it with an explanation and change nothing. It never forces, resets, rebases, or deletes a remote
branch, and re-running it after success is a no-op.

## Core safety rules

- A backlog item is not executable until it is valid, explicitly covered by landed spec, and defined.
- An observation is not automatically a task.
- Agents do not invent missing product intent or accepted trade-offs.
- Every active task has at most one claim and one feature branch.
- Parallel execution uses separate Git worktrees.
- Execution never edits a protected branch.
- Review requires acceptance-to-evidence mapping.
- Closing requires accepted review, integration, and verified acceptance.
- Unsafe branch or worktree cleanup is refused.

## Skills

- `explore-workspace` — answer cross-workspace questions about themes, related work, overlaps, decisions, and backlog structure without changing PM state.
- `setup-kotta` — initialize a project workspace.
- `define-task` — investigate and formalize work.
- `validate-observation` — verify and disposition discovered work.
- `start-task` — safely claim and isolate a defined task.
- `execute-task` — implement one bounded task.
- `execute-batch` — coordinate a batch of tasks.
- `submit-review` — submit implementation with evidence.
- `close-task` — verify completion and safely release resources.
- `report-kotta-bug` — prepare and, after explicit approval, submit a Kotta defect report as a GitHub Issue.
- `consolidate-model` — find where one concept lives under several names across code, docs and wire, and propose consolidations in chat. Creates nothing.

The specification workshops draft and read nodes under `.kotta/spec/` and perform no lifecycle
transition:

- `impact-mapping` — connect a goal to the actors, impacts and deliverables that could reach it.
- `story-mapping` — arrange user stories along the journey they serve, and slice a release from it.
- `use-case-modeling` — state a goal-directed interaction with its alternatives and exceptions.
- `example-mapping` — settle a story's rules and open questions with concrete examples.
- `event-storming` — map domain events, commands and policies, and find the entities behind them.
- `ubiquitous-language` — agree one term per concept and record it as a glossary node.
- `quality-scenarios` — express a non-functional requirement as source, stimulus, response and measure.
- `design-by-task` — derive the interface obligations a task implies, as preconditions and postconditions.
- `requirements-traceability` — check coverage from accepted specification to evidence, and report
  dangling specification edges.

## CLI overview

```bash
kotta init
kotta migrate --dry-run
kotta migrate
kotta validate
kotta status
kotta sweep
kotta questions
kotta questions T-024

kotta task new --title "Add filtered export" --type feature --profile ui workflow
kotta task define T-014 --from /tmp/T-014-draft.md --draft   # iterate a capture in backlog; no coverage yet
kotta task define T-014 --from /tmp/T-014-definition.md      # coverage-checked; valid coverage moves it to defined
kotta task validate T-014
kotta task start T-014 --agent codex
kotta task start T-014 --agent codex --caller
kotta task brief T-014 --out /tmp/T-014-brief.md
kotta task execute T-014 --agent claude
kotta task execute T-014 --resume
kotta task review T-014 \
  --evidence "Filtered export is produced=run: npx vitest run tests/export.test.ts" \
  --evidence "Export respects active filters=tests/export-filter.test.ts inspected" \
  --pull-request PR-123
# An evidence value starting with `run:` declares a runnable check: the submission executes it
# in the execution checkout, refuses on a non-zero exit, and records the command, the commit it
# ran on and `exit 0` next to the evidence. Entries without `run:` remain prose.
kotta task close T-014 --approve
kotta task reopen T-014 --approve
kotta task settle T-014 --reason "The interpretation was argued and accepted at review; nothing is outstanding."
# Records that a declared deviation left nothing behind, so `kotta sweep` stops raising it. It is
# bookkeeping, not a gate: it names who settled it and stamps no approval receipt.

kotta batch validate P-012
kotta batch start P-012 --agent codex
kotta batch status P-012
kotta batch close P-012 --approve

kotta observation new --title "Divergent permission checks" --type inconsistency --evidence "src/a.ts and src/b.ts differ"
kotta observation validate F-032
kotta observation resolve F-032 --disposition create-task --approve

kotta decision create --from /tmp/cutover-decision.md --approve

kotta claim list
kotta claim release T-014 --force

kotta task list --state review
kotta observation list --state new
kotta decision list
kotta batch list

kotta task show T-rf5d4tfp
kotta observation show F-01kz9d5nqwdwb7r2c0jdzchspa
```

`show` answers the other half — one entity as it is stored, its state, its set facts and its body — and is deliberately not `task brief`: the brief assembles the execution package for an agent about to implement, and exists for tasks alone. **The id the CLI prints is the id the CLI accepts:** the short form shown in every listing resolves on every command that takes an id, and an ambiguous short form is refused naming the full ids it matched rather than guessing between them.

`gap` reads only committed bytes from the configured base branch. For every landed spec node it
looks for an explicit node-id trace in code, tests, or command definitions, then reports the reverse
direction too: validation rules and gates with no nearby spec-id trace. The latest commit that
touched the spec supplies the changed nodes, which lead the report. An `accepted` entry such as
`"implementation: waiting for the provider sandbox"` keeps a deliberate absence visible under
Accepted gaps. The report is deterministic and creates no task or observation; its MCP equivalent
is `gap_report`.

`list` answers "what is in this workspace" for every entity, with the title first and the id after it, and narrows with a repeatable `--state`. It is read-only and deterministic: the same workspace lists the same bytes, and nothing — not even the index — is written. The same four listings reach the calling chat as read-only tools, so an agent orienting itself never has a reason to read `.kotta/` directly.

Every command supports `--json`. Mutations validate before writing and report both the violated rule and corrective action when rejected.

Before a task can be defined, its `Open decisions` section must say that no decision remains.
Kotta accepts `None`, `None.`, `N/A`, `N/A.`, `No open decisions` and `No open decisions.`
case-insensitively; real unresolved choices still keep the task in backlog. Every acceptance
bullet must also name a referenced spec id or have an exact-text entry in frontmatter `coverage`.
If no accepted node covers it, create an observation and amend the spec first.

**Small contexts by default.** Each task executes in a fresh agent context whose intent input is `kotta task brief <id>` — the task body, its referenced decisions, its profiles and its claim, nothing else. The brief is deterministic and reports an approximate token count; above a threshold (`--warn-tokens`, default 12000) it warns that the task is probably too large or under-referenced. This is a quality gauge, not a thrift trick: if a task cannot be executed from its brief plus the code in the worktree, the task is incomplete — record the gap instead of widening the context.

**`task execute` is the command that makes that the default (D-009).** `kotta task execute <id> --agent <agent>` does the start, assembles the brief and launches the agent with the brief as its only input — the caller's context never reaches it. It refuses before creating anything when the task is not defined, a claim or execution context already exists, the repository is dirty, or the agent command is missing, so a missing binary can never leave a half-built worktree. The output — human and `--json` — names the brief's token count, the agent, the branch and the worktree; record the token count per task in the run log.

When continuity matters more than isolation, `kotta task start <id> --agent <agent> --caller`
creates the same branch, claim and worktree but labels the run `inherited`. The current caller then
continues inside the returned worktree. This is explicit and opt-in; fresh brief-only execution stays
the default, and persisted chat is never injected wholesale into a fresh executor.

A non-zero exit or an empty result is `agent-failed`: the claim and worktree are kept for inspection and the task does not move to review. An interrupt terminates the agent, keeps the claim and worktree, and names what to decide by hand. Retry with `kotta task execute <id> --resume`, which reuses the existing execution context (and is also how a context created by `task start` gets its agent) — a second plain `execute` always refuses rather than starting a second agent. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"` requires a reason, appends it to the prompt as a declared deviation and reports it in the output.

**The record is derived from the run, not from the agent.** `execute` captures the worktree's baseline — the task branch tip and its porcelain status — before it launches, and compares afterwards. An agent that exits 0 and talks about work it never did is recorded as `no-change`, not `implemented`; commits and uncommitted changes both count as `implemented`. Each run appends one execution event carrying the resolved state, the agent, the baseline and resulting commit, whether uncommitted changes remain, the exit code, and the agent's own printed output — stored as reported, never promoted into the state decision. A resume appends a new record instead of rewriting the previous one, updates the claim when it names a different agent, and unrelated dirt in the control worktree can no longer discard a completed run's record.

The agent binary is resolved from `--agent` (`claude`, `codex`, or any command on `PATH`); `KOTTA_AGENT_COMMAND` overrides the executable, which is how the test suite drives a deterministic script double instead of a real agent. Review, merge and close stay separate human gates — `execute` never enters them.

**What a launched agent may do is the operator's decision, not Kotta's.** `agents.permission_mode` in `.kotta/config.yaml` is passed to the agent as `--permission-mode`; with nothing set — the shipped default — Kotta passes no flag at all and the agent's own project settings decide, so a launched run never receives authority the caller had not already granted. That default is safe rather than convenient: `claude -p` asks before it writes and a headless run has nobody to answer, so an unconfigured run may complete having changed nothing. `execute` says so at launch, and the baseline comparison then records it as `no-change` rather than as an implementation. Setting a mode that permits writes — `acceptEdits`, or `bypassPermissions` for a fully autonomous run — is a deliberate act, made once, visible in the workspace config and revocable there. A mode that forbids edits by definition (`plan`) is refused at launch naming the cause, because a planning run cannot implement a task.

A decision draft contains `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. `decision create` requires explicit human approval, assigns the
next stable `D-001`-style identifier and current date (or validates supplied values), and
atomically publishes the validated record beneath `.kotta/process/decisions/`. Pass `--id D-001`
when a caller needs to reserve a specific stable identity; an existing identity is never
overwritten. The canonical filename is the identity alone (`D-001.md`), so different
titles cannot race around the identity reservation.

## Report a bug

Defects in Kotta itself go to
[the issue form in `arpadtamasi/kotta`](https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml).
The same destination and the same report task serve every entry point:

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
task by itself.

## Tests

`npx vitest run` runs the whole suite in one command. `tests/unit` and `tests/integration`
cover the CLI and run in Node. `tests/ui` holds component tests for the React board: they
render a real component from `ui/src/` with `@testing-library/react` in `jsdom`, and assert
what the user sees plus how the surface reacts to a click or an input. No browser is started —
`site/tests` is the separate Playwright suite, run with `npm run test:site`.

The board's built bundle is tracked in `ui-dist/` so a checkout runs `kotta ui` without a build
step, and the suite builds `ui/` and compares the result with it — a bundle that no longer matches
its source fails by name, with `npm run build:ui` as the fix. Regenerate and commit it in the same
change as any edit under `ui/src/`.

To add a UI test, copy [`tests/ui/done-stage.test.tsx`](tests/ui/done-stage.test.tsx). The
first line, `// @vitest-environment jsdom`, is what puts that file in a browser-like
environment; everything without it stays in Node, so a CLI test can never drift into `jsdom`.
Export the component you want to render from `ui/src/App.tsx` and keep the fixture local to
the test.

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

The entities are **observation**, **task** and **batch**, and the state between backlog and
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
| flat lifecycle directories | `.kotta/process/` |
| `.kotta/forms/` and registered node directories | `.kotta/spec/` |
| `ready/`, `findings/`, `packages/` | `process/tasks/`, `process/observations/`, `process/batches/` |
| `.kotta/index.md` | `.kotta/process/index.md` |
| `status: ready` | `status: defined` |
| a task's `package:`, `source_finding:` | `batch:`, `source_observation:` |
| a batch's `tickets:`, `kind:` | `tasks:`, removed |
| an observation's `finding_type:`, `ticket:` | `observation_type:`, `task:` |
| a claim's `ticket:` | `task:` |
| `config.yaml` `packages:`, version 1 or 2 | `batches:`, `version: 3` |
| a batch's `contracts:` and task-oriented authority fields | `tasks:` and task-oriented authority fields |
| an observation's or claim's `contract:`; an event's `contract:` / `contract.*` action | `task:` / `task.*` |
| `workflow.allow_agent_defined_contracts`, config version 3 | `workflow.allow_agent_defined_tasks`, version 4 |
| state directories under `process/` (`backlog/` … `done/`, `observations/new|resolved/`, `batches/<state>/`) | one flat directory per kind (`process/tasks/`, `process/observations/`, `process/batches/`), state in the frontmatter `status` field, `version: 5` |

Version 4 was the work-unit vocabulary migration; version 5 is the state unification: one entity,
one stable file, lifecycle state in the frontmatter alone. The directory a file sat in was the
old shape's state authority, so the migration transcribes that verdict into each file's `status`
before the directory disappears, and it refuses — naming both copies — a workspace where a past
merge left one entity in two state directories at once. The compatibility window is one schema
version: the v3 `contract` vocabulary readers and CLI/MCP aliases are gone, and `task dedupe` /
`batch dedupe` are gone with the failure mode that justified them. `kotta sync` still removes
legacy task-skill directories only when its ownership manifest proves Kotta installed them and
their renamed replacement is present.

The window has two sides, and Kotta answers them differently. A workspace older than the Kotta
reading it is named as older and answered by `kotta migrate`. A workspace *newer* than the Kotta
reading it — the ordinary result of upgrading one checkout before another — is named as newer, with
both versions stated, and answered by upgrading Kotta: migration only ever carries a workspace
forward, so `kotta migrate` refuses that direction instead of rewriting it back. A version that
cannot be read is refused as neither.

**The workspace arrives whole.** The rules file `.kotta/AGENTS.md` moves to the running package's
copy alongside the records — it is the one document every agent in the project reads, and a
migration that leaves it behind keeps instructing them from the version it came from. A
hand-edited copy is reported as drifted and left alone, with the one command that discards those
edits; the drift rule is the same one `kotta sync` follows.

**The migration says whether what it produced holds.** When it writes, it validates the workspace it
just produced and reports the result, naming what failed. It reports rather than repairs, and an
invalid result is still a migrated result: the records moved either way, so the migration does not
refuse after the fact. A dry run plans the rules refresh and performs neither it nor the validation.

**Identifiers never move.** No id, no filename and no reference *value* changes — this is vocabulary,
not identity (D-010). The command compares the id set before and after and refuses to lose one.

Migration preflights every source, destination, registered spec directory, and unclassified root
directory before its first write. A conflict stops with concrete paths and leaves every byte
unchanged. A completed run is idempotent: the second run reports "already on the current shape".
Every other command refuses a legacy flat workspace with an error that names `kotta migrate`; there
is no mixed-schema compatibility layer behind that refusal.

**Commit the migration before you read the board.** `kotta ui` reads the workspace from the configured
base ref through Git plumbing, not from the working tree, so a migration that has not reached that ref
yet shows the right header path above no content at all. The command says so when it finishes, and the
board carries the same notice until the gap closes.

## Maintainer releases

`package.json#version` is the only release version source. Merge a reviewed version bump to
`main`, then create `v<version>` on that exact commit. The `npm release` workflow rejects a
tag/version mismatch or a commit outside `main`, runs the full tests, inspects the packed
allowlist, and exercises a clean install before publishing.

The bump changes the install line `.kotta/AGENTS.md` interpolates, so **run `kotta sync` as part of
the bump and commit what it writes** — never edit that file by hand. Kotta reports a rules file it
did not write as drifted and leaves it alone, so a hand edit made during a release reads as the
operator's and freezes the file behind its template. That is what 0.9.0 did; `kotta sync
--replace-rules` is the way back if it happens again.

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

## License

MIT. See [LICENSE](LICENSE).
