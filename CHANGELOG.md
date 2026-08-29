# Changelog

All notable changes to Kotta (called A-Team before 0.3.0) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **A resolution names the work it made, or the work it joined — never the wrong one.** Resolving an
  observation with `attach-to-existing-task` printed `Captured <the observation's title> (<the
  existing task's id>) in the backlog.` Nothing was captured: the noticing was folded into work that
  already existed, and the two halves of the line named different entities. The renderer branched on
  a task id being present, which both constructive dispositions set — one because it minted a task,
  the other because it named one — and the result carried no title for either, so even a capture
  reported the observation's name rather than the name a `--task-title` had just given the work. The
  result now carries the task's own title, read from the task, and says whether that title was
  inherited; the line reads `Folded into …` for an attachment and `Captured … in the backlog.` for a
  capture. Only the spoken line was ever wrong — every record on disk was correct.

- **The board no longer hands the operator a command that does not exist.** It printed
  `kotta task sign <id> --approve` in two places — the empty *What runs next?* panel and the CLI
  fallback sheet — and running it answers `unknown command 'sign'`. `sign` became `define` in a
  rename the CLI, the MCP tools, the skills and the rules file all followed; the board did not, and
  its prose was inverted with it (*"shape a backlog task until it validates, then define it"*, when
  defining is what validates). Both sites now name `kotta task define <id> --from <file>`.
  The reason it survived a whole rename is the part that is now closed: the other two surfaces are
  derived from one operation registry and their totality is asserted as a set comparison, while the
  board's commands were literals nothing read. A check now reads the board's own source — not a list
  kept beside it — and fails naming the file, the line, the command and the text whenever the board
  prints one no declaration carries. Being read-only kept it from acting on the stale word; it did
  not keep it from handing that word to a human, and the declaration rule now says so.

### Added

- **The specification has a view of its own, and the derivation chain names it.** The previous wave
  made the agreement legible where a task is read and left it with no way in: 141 nodes were
  reachable only through a task that happened to name one, and the rail called the flow
  *Observations · Tasks · Batches* when the chain the product runs is observations →
  specification → tasks — `amend-spec` is the primary constructive disposition and coverage against
  an accepted node is what makes a task defined, so the middle term was the one omitted. The rail
  now names it in its true position, and the specification is a destination: every node listed under
  the form that declares it, searchable by title, filterable by form. The three admission kinds are
  counted and filtered apart — never as one total, because "nobody looked" and "many sites realise
  this and none can name it" ask for opposite work — and each row says whether any task executes the
  node. An opened node shows the edges it answers, the nodes that answer it, and the tasks that
  execute it, each named by title and opening what it names. No form name, edge name or prefix is
  compiled into the board: all three come from the registry the workspace carries, so a project's
  own form is listed and traversed with nothing added here. The board stays read-only; computing
  the gap remains `kotta gap`'s work, and what the board shows is what each node itself records.

- **The board shows the agreement, not only its execution.** Opened at sight by the operator: *"the
  spec isn't even on it."* `src/commands/ui.ts` held no occurrence of `spec` — the board's data layer
  never opened `.kotta/spec/`, so 141 nodes across 11 forms were absent, and the board's `Task` type
  carried neither `spec` nor `coverage`, leaving the gate that lets a task become defined invisible
  on the one visual surface. The single trace of the specification anywhere was the observation
  drawer printing bare ids for an `amend-spec` disposition, with no title and nothing to open.
  The board now reads the specification through the form registry, from the same base ref as
  everything else. A task shows the accepted nodes it executes and the map from each acceptance
  condition to the nodes that carry it, beside its brief. Every reference is named by its title and
  opens the node, which shows its form, its file, its admission as written, its sections, and the
  tasks that execute it — the direction the specification itself may never point. No specification
  prefix is compiled into the board: a project's own form declares its own, so a minted id is
  recognised by shape and resolved by lookup. A specification view of its own is the next wave; this
  is what stops its absence from misleading.

- **`kotta spec new` mints and scaffolds a specification node.** The accepted use case says
  identifiers are minted by Kotta, not written by hand, and that an author asking for a node gets
  one already carrying its id and its form's skeleton. There was no `kotta spec` command at all:
  every one of this workspace's 141 nodes was written by hand, 26-character id included, in a
  repository whose own rule is that identifiers are the machine's. `kotta spec new <form> --title
  "…"` (and `spec_create` from the calling chat, where the workshops run) mints the id from the
  form's declared prefix, places the file under the form's directory in the filename shape the form
  declares, and lays out a section per required heading and a field per required edge — with each
  edge's own registered question beside it, saying which this node answers itself and which another
  node answers by pointing here. Everything comes from the registry, so a project's own form is
  served with nothing added in code. An unregistered form is refused by naming the ones there are,
  and nothing is written. The scaffold is a draft: nothing is committed, because a shaped node
  becomes the agreement when it lands on the base branch on a human yes — and the result says that
  until it is filled in, `kotta validate` names each unanswered part with its form's own question.

### Fixed

- **A landing that only re-kinds admissions is not a delta.** `kotta gap` opened with every path
  the last spec commit touched, so the pass that gave all 107 nodes an admission kind produced a
  delta section listing the entire specification — implying 107 agreements nobody made, in the one
  section that exists to lead the report. An admission says which kind of gap a node has and why:
  bookkeeping about the evidence, not a change to what the node promises. The delta now compares
  the two trees the section already reads and keeps the nodes whose own words or fields moved, and
  where a landing touched more nodes than it changed agreements in, the report says both numbers.
  A path the landing added or removed is always a delta. The analysis stays a read.

- **A capture born from an observation is named for the work, not the symptom.** `create-task`
  minted the task with the observation's own title, so a sentence describing what was noticed
  became the name of what will be done — through the backlog list, every gate question and every
  summary a human reads, until someone retitled it at define. Reported from the field on two
  captures at once. The disposition now carries a title for the work, on both surfaces
  (`--task-title`, and `title` in the approval payload, scoped to `create-task` exactly as `spec`
  is to `amend-spec` and `task` to `attach-to-existing-task`). Omitting it still creates the
  capture — a remedy that is not yet worded is worth capturing — but the result then says whose
  name the work is carrying and what replaces it, rather than leaving it to be noticed.

- **A batch start report no longer claims an outcome it can never observe.** The release report
  ended with `No tasks were dispatched; every member is done.` — a line no result reaching that
  renderer can support: closing or cancelling a task completes every open batch holding it, and a
  completed batch is refused before a report exists. Reaching the line took a hand-written status,
  which is the one thing the rules forbid. The line is gone, and what does happen is stated
  positively: the last member closes, the batch completes, and a start after that is refused by
  name. Recorded as F-01m0zpg89ydwy8q0ygtg485bq5, from a deviation declared at review.

- **A migration hands over a whole workspace, and says whether it holds.** `kotta migrate` carried
  the records forward and left two things behind. The generated rules file stayed as it arrived, so
  a migrated workspace kept instructing every agent in the project from the vocabulary, the commands
  and the install line of the version it came from — found in the field, where an agent asked right
  after a migration answered from the old rules. And the migration reported success while knowing
  only that no identifier was lost: a workspace its own validator would refuse could be reported as
  migrated, and the operator met the refusal at the next command. A migration that writes now brings
  the rules file to the running package's copy through the same writer `sync` uses, so a hand-edited
  file is reported as drifted with the one command that discards those edits, never replaced. It
  then validates what it produced and says so, naming what failed — as a report, never a refusal:
  the records moved either way, and an invalid result is still a migrated result. A dry run plans
  the refresh and performs neither it nor the validation.

## [0.10.0] - 2026-08-26

0.9.0 was tagged but never reached the registry, so npm's latest stayed at 0.7.0 while the rules
file Kotta writes into every project named 0.9.0 as its install line. 0.10.0 is the first release
carrying everything below and the 0.9.0 section under it.


### Added

- **Entities are named to humans by title, not by identifier.** Eight of the nine sentences the MCP
  tools returned to a calling chat named a bare identifier and no title; five of the six gate
  descriptions read `task.close T-01m0vqr9k…`; and every lifecycle command in the terminal printed
  `kotta task close completed.`, naming neither the entity nor the work. One resolution now serves
  the terminal, the chat and the gate, because three would eventually disagree about the same
  entity. A gate names every entity it mentions, its subject and its references alike. Identifiers
  stay permanent, stay in the structured payloads, and still travel beside a title where the reader
  will type one back; where no title exists, the id is what names the entity, because a blank name
  claims less than the result carries. The shipped rules file generalises the same instruction to
  the agent's own prose. Asked for as T-01m0jdnv5fjechrfqwphvrrgqx on 2026-08-21.

- **A batch holds no more members than its configured parallelism.** The cap was applied to the
  members whose state is `defined`; members already active were filtered out above it and so never
  counted against it. Measured with four independent members and `--parallelism 2`, two releases
  with nothing finished in between left four tasks active, four claims and four worktrees — and the
  run reported the two it had left running as `Waiting:`. A release now reads the running members
  from the same state the eligibility filter reads, spends the budget against them, and names the
  budget when it holds work back; running is reported apart from waiting. Which member is eligible
  is unchanged. Settled by D-01m0zhkpw7v7pq322pg5nycf1d after both readings of the word proved
  defensible from the code.

- **An entity's open questions are a list, not prose.** `Open decisions` was read by one literal
  check: the section either said `None.` or the whole task was refused, with no way to say which
  point was still open, no way to count what was waiting, and no way to see it anywhere but by
  re-reading the entity. Undecided points are now enumerated — one list item each, addressed as
  `<id>/Q<n>` — and a question is answered by naming the decision record that settled it, staying
  where it stood so the reasoning survives the answer. Defining refuses by position and quotes what
  is still being asked; `kotta questions [<id>]` and `workspace_questions` list them for one entity
  or for every entity at once, blocking ones first; the board shows them as their own panel and
  carries the reader to the line each is written on. One parse serves all four, so a listing can
  never disagree with a refusal. Nothing already written changes meaning: a denial is the empty
  enumeration, and every entity in this repository validates exactly as before. Asked for as T-024
  on 2026-08-01.

- **`kotta sweep` answers what has stopped, and why.** `status` gives three counts; the question
  actually asked — *what is not finished, and why* — was re-derived by hand every time, six times
  in one session. Sweep derives it from tasks, batches, observations, claims and Git, and gives
  each item the reason it stopped and the one action that would move it: `waiting-on-you`,
  `stalled`, `undeclared-deviation`, `dangling-batch`, `never-started`, `drift`,
  `undispositioned`, ranked by what standing still costs and oldest first inside each. It writes
  nothing, runs where `validate` refuses, names the threshold whenever an age decided, and keeps
  the default to a screen — a category with more than three shows the oldest and counts the rest
  by name, with `--json` carrying everything. Asked for as T-019 on 2026-08-01.

  Its first honest run on this workspace found what it was built to find: two approvals proposed
  three weeks ago that the work went around and nothing can now close
  (F-01m0yta2mqnm3pw84vg6rrrhtc), and 29 tasks closed with a declared deviation that no
  observation records (F-01m0ytmp2fpw8kzn5n17sdgc5a).

### Fixed

- **A noticing the human made is recorded as the human's.** 146 of Kotta's own 150 observations
  carried `origin: agent`, and the four that did not came from migration — not agents defaulting,
  but the only value the tool could write: `origin`, `confidence` and `severity` were literals in
  `writeObservation` and no surface offered any of them. The operator's noticings are made in
  passing, and stayed in the conversation they were said in. `observation new --origin human` and
  the same field on `observation_create` record whose noticing it was; the default is unchanged,
  an undeclared value is refused naming the two that exist, and the listing marks a human's
  without marking every agent's. `severity` and `confidence` are deliberately left as they are:
  nobody has ever been able to supply one, so there is no evidence about whether they earn their
  place (F-01m0ypea8kn7shamp4a0t798a8).

- **Capturing an observation from the chat no longer refuses as busy.** `observation_create`
  wrapped its standalone branch in a control-plane lock and called a service that takes the same
  lock, so the inner acquisition always found it held: the chat could capture an observation
  attributed to a task and never a standalone one. The wrapper's commit was already the service's
  own (F-01m0ypjk6gzymm0y51m96mmdaw).

- **The brief names the command its own boundary rule depends on.** The fixed header told the
  executing agent that work outside the task's scope is recorded rather than silently done — the
  rule — and never what to call. An agent that has not read the skills, or runs on a host where
  they are not installed, was told to do something and not told how. The header now names
  `observation new` in the same proved invocation it already states for reaching Kotta, so the rule
  arrives with its means. The fixed header also stopped being what the size warning tells you to
  split: its size is still reported, but the advice — "split it or sharpen it" — is advice about
  task content, and the header grows with Kotta rather than with the task.

- **Attaching an observation names the task it attaches to.** The disposition's whole meaning is
  the work a noticing was folded into, and nothing stored one: `observation resolve` took
  `--disposition` and `--spec`, and only the `create-task` branch ever wrote a link. Measured on
  Kotta's own workspace, 61 resolutions carried `attach-to-existing-task` and none carried a task.
  The cost was not bookkeeping — the honest exit was unreachable, so the reachable one got used
  instead, minting an empty duplicate that was cancelled the same day. `--task` now names it,
  canonicalising the short id the listing prints, refusing an id that resolves to nothing, and
  refusing itself on any other disposition; `approval_request` carries the same field under the
  same rule, and shows the human which task. The 61 are not back-filled by guessing — which task
  each was is recorded nowhere — but `observation show` says the link was never recorded rather
  than showing silence.

- **A gap refusal says when uncommitted work is the reason.** `kotta gap` reads the accepted
  specification on the base branch, deliberately — the agreement is what landed, not what is being
  typed. So a wave that lands a spec node together with the code naming it fails until the commit
  exists, and the refusal explained none of that: it named the node, named the id it looked for,
  and said the evidence was missing. It cost a diagnosis four times in three days. When the report
  refuses and the working tree holds uncommitted paths that could carry the evidence, the refusal
  now names the ref it read, what is uncommitted, and that committing settles it — without
  claiming those files are the evidence, which it has not read. A clean tree adds nothing, and the
  verdict is unchanged either way.

- **A drifted rules file is no longer a dead end.** Kotta promises to keep `.kotta/AGENTS.md`
  current and to report a *hand-edited* copy as drifted rather than replacing it. Releasing 0.9.0
  broke both halves at once: the bump edited the one interpolated line by hand instead of letting
  Kotta write it, so Kotta's own edit read as the operator's, the recorded hash went stale, and
  every `sync` since reported drift and left the file behind its template. Nothing named a way out
  — the two that existed were deleting the file, or rewriting `.kotta/.kotta-generated.json` by
  hand, which is the sort of edit these rules forbid and which the suite itself was doing.
  `kotta sync --replace-rules` now takes Kotta's copy deliberately, reporting how many lines it
  discarded, and both `sync` and `status` name it when they report drift. The maintainer-release
  section says the bump runs `kotta sync` rather than editing the file.

### Added

- **Recording a decision reaches the calling chat.** Five of Kotta's six approval-carrying
  mutations were proposed and answered in chat; the sixth was declared absent from that surface
  with the reason "a chat proposes the draft and the operator publishes it" — which is the operator
  typing a command, exactly what rule 5 forbids and what the accepted specification says a gate
  must not require. `approval_request` now takes `decision.create`, carrying the decision's
  Markdown as its one payload field. The id is minted with the proposal, the way `task_create`
  mints a task id, so `entity` is omitted for this action alone; the elicitation shows the draft
  verbatim above the question, and the yes publishes it through the same service the CLI uses, with
  the same receipt. A duplicate id is refused before the human is asked; a draft that fails its own
  validation fails durably after the yes and lands nothing. `kotta decision create --from <file>
  --approve` is unchanged.

- **The approval machinery says what it enforces.** Three rules the code has always enforced and
  nothing promised now sit in the specification, each with an example and each naming the site in
  `src/commands/approval.ts` where it is kept: an entity carries at most one undecided approval,
  each action declares the exact payload it accepts, and an approval reaches one terminal phase and
  keeps it — a failed application is recorded as a failure, never as a transition.

### Removed

- **The sign gate is gone.** `kotta task sign` could only fire in a workspace that opted into
  `workflow.require_human_sign_approval` and held a task with no spec references — a pre-coverage
  shape `migrate` carries everyone out of — and `kotta batch sign` had never run at all: zero events
  across six batches. Both commands, the config key they depended on, the `task.sign` approval
  action, and the four branches the flag fed in `define`, `validate` and `start` are removed.
  Defining a task with valid coverage is the whole transition to `defined`; validating a batch is
  the whole transition for a batch. `init` no longer writes the key and the published config schema
  no longer admits it; `migrate` no longer renames the older `require_human_ready_approval` into it.
  An existing config that still carries the key is left exactly as it is: nothing reads it.

  **Breaking:** `kotta task sign` and `kotta batch sign` no longer exist, and `approval_request`
  no longer accepts `task.sign`. Every lifecycle test that used the sign path now runs the product
  path instead — a landed spec node and a covered definition — so nothing was covered only by the
  retired gate: the suite is the same 67 files and 447 passing tests before and after.

## [0.9.0] - 2026-08-24

### Added

- **An admission says which kind it is.** `kotta gap` counted 106 admitted gaps as one number, and
  a triage found three situations under one label: 52 forms no code site would ever name, and 54
  questions nobody had asked. Admissions are now `structural`, `unexamined` or `unimplemented`, the
  report counts and lists the three apart, and an admission naming no kind is refused the way an
  unadmitted promise is. This workspace's inherited admissions were kinded by form, and the
  structural wording says so: none of them claims that anybody examined the node. `unimplemented` is
  the count to read as debt, and it stands at zero here because nobody has yet looked closely enough
  to move anything into it.

- **The published schemas are enforced.** Kotta ships six JSON schemas declaring eighteen sets of
  permitted values; four had anything in the code to compare against, and the rest existed only as
  TypeScript unions, which vanish before a comparison could happen. Every published set now has a
  runtime constant beside it — the types are derived from those constants rather than restating
  them — and one suite reads the shipped files and asserts the two agree in both directions. A
  published enum with no pairing fails the suite by name, which is how `task.priority` and
  `task.risk` were found. `validation.ts` no longer keeps its own copy of the task states "in
  lockstep" with `entities.ts`; it imports them.

- **The brief tells the agent how to reach Kotta, and `kotta doctor` answers on demand.** Every
  execution brief now carries a `- kotta:` line naming the interpreter and entry point that
  assembled it. The brief declares itself the complete execution context and routes every state
  change through Kotta, while resolving the bare name `kotta` was left to a PATH nobody had checked
  — and a non-interactive shell, which is what an agent worktree gets, resolves it to nothing. The
  new `kotta doctor` reports whether the bare name resolves in the environment it is handed, and
  names the invocation that works when it does not. The shipped skills keep writing
  `kotta task close <id>`: they are read by people, and absolute paths there would be permanent
  noise. `kottaInvocation()` moved to `src/core/invocation.ts` so `integrate` and the brief answer
  from one fact.

- **Every accepted promise is kept or admitted.** `kotta gap` no longer only reports: it refuses a
  workspace holding a specification node that has neither evidence naming its id nor an admitted
  implementation gap in its own frontmatter, naming each and exiting non-zero. The report still
  prints in full when it refuses — it is why the command is run — with the failure named beside it.
  Coverage bound only the front of the lifecycle, so the number of promises with no evidence could
  only grow; it stood at 108 of 119 nodes. The rule does not ask for that number to fall, which
  would reward writing ids into comments. It asks for every promise to sit in one of two columns by
  someone's decision. The 108 that predate the rule carry an admission saying exactly that: they
  were admitted in bulk and not examined individually.

### Fixed

- **The gap report is readable at a hundred admissions.** Kinding the admissions produced a correct
  report nobody would finish: 333 lines, 122,078 characters, and one sixty-word paragraph repeated
  108 times, because wording written for a single node was never read back against a hundred.
  Admissions sharing a reason word for word are now grouped under that reason stated once, with
  their nodes named beneath, and the spec-delta section shows a changed admission by its kind rather
  than reprinting the essay. `--json` is untouched: every entry keeps its own reason, because
  nothing there is reading it. Length was deliberately not made the measure — a line per node is
  what the report is for, and no entry is cut or elided.

- **The invocation Kotta writes for a host does not depend on PATH.** `kotta integrate` recorded
  `command = "kotta"`, a name resolved against a PATH Kotta cannot see — and a non-interactive
  shell, which is what hosts and agent worktrees run in, loads no version manager, so a Kotta
  installed through one is absent there. It now records the interpreter running Kotta and the
  absolute path of Kotta's own entry point, both facts the running process holds; the written
  invocation starts the server with an empty environment. A configuration whose recorded command
  has since vanished is reported by name, with the invocation that would work, instead of being
  reported as already configured — and is never rewritten under a human who may have edited it.

- **A newer workspace is refused, not downgraded.** A Kotta meeting a workspace whose recorded
  shape version is higher than the one it implements now names both versions and says to upgrade
  Kotta. Before this it called the workspace legacy and prescribed `kotta migrate`, which — being
  exempt from the shape check so it can read old workspaces at all — planned `version: 6 → 5` and
  would have rewritten the newer workspace backwards. `migrate` loses that exemption in the newer
  direction only; the older direction keeps its wording, its exemption and its plan exactly. An
  unreadable version is refused as neither direction. The board's notice follows the same split,
  and the CLI now recognises its own shape refusal by type rather than by looking for the words
  "kotta migrate" in the message — which had swallowed the first refusal that correctly omitted
  them.

- **What the terminal says is what the result carries.** A command whose result did not succeed
  now names the failure in its human output instead of printing a completed line: `kotta validate`
  reported `kotta validate completed.` while exiting 1, so its errors reached only `--json` and the
  exit code. The fix is in the shared rendering path, so it covers every command at once. And a
  task retired by `task cancel` is displayed by its resolution — in `task list`, `task show`,
  `batch status` and on the board — rather than as `done`, which had made abandoned work
  indistinguishable from delivered work. `batch status` gained a human rendering it never had, and
  reports how each member ended. Nothing stored changed: `status` and `resolution` remain separate
  fields, and a cancelled task still ends at `done`.

### Changed

- **Both surfaces are derived from one operation declaration.** `src/core/operations.ts` names
  every operation once with an identity that belongs to neither surface, and states per surface
  either the name that carries it or the reason it does not — in both directions, since two
  operations live only in chat. The MCP server and the CLI now build their tables and let the
  declaration register them, refusing at startup if a surface carries something undeclared or
  misses something declared, and the MCP instruction sentence derives its gated-action list from
  `APPROVAL_ACTIONS` instead of restating it. Per-operation output moved from a switch onto the
  command that owns it. No command, tool, schema, flag or help text changed: two surface snapshots
  prove it. Totality is asserted as a set comparison, never as a count.

### Added

- **A capture is drafted in place.** `kotta task define --draft` (and `task_define` with
  `draft: true`) stores or amends a backlog task's text with its structure validated and no
  coverage demanded — the task stays in backlog, a changed title renames the stable file, and
  hand-editing the stored capture stops being the only way to iterate it. Coverage keeps
  guarding the boundary where executability begins: backlog → defined. A draft on a task that
  already left backlog is refused; defined tasks are amended only at full definition strength.

- **A declared check is run, not transcribed.** A review evidence value may start with
  `run: <command>`: the submission executes it in the task's execution checkout before anything
  is written, refuses the whole submission by name when it exits non-zero, and records the
  command, the commit it ran on and `exit 0` next to the evidence as the receipt of a real run.
  Prose evidence stays allowed and unmarked; nothing re-runs at close; no sandbox is added.

### Breaking

- **State lives in one place: workspace shape v5.** One entity is one stable file —
  `process/tasks/`, `process/observations/` and `process/batches/` are flat, and lifecycle state
  lives in the frontmatter `status` field alone. A transition edits that field in place, so two
  branches transitioning the same entity meet as an ordinary merge conflict on the status line,
  never as a second copy in a second directory. `kotta migrate` flattens a v4 workspace: it
  transcribes each state directory's verdict into the file's `status` before removing the
  directory, keeps every identifier, and refuses — naming both copies — a workspace where a past
  merge already duplicated an entity across states.
- **`task dedupe` and `batch dedupe` are removed** with the failure class that justified them;
  an id collision inside the one flat directory remains a `DUPLICATE_ID` validation error.
- **The v3 compatibility window closed.** Only schema version 5 is readable; the `contract` CLI
  alias, the `contract_list`/`contract_show` MCP aliases and the stored-v3-vocabulary readers are
  gone. `kotta migrate` still carries any older shape — v1 through v4 — forward in one run.

### Changed

- **The public surfaces say what Kotta is for before how to install it.** The README opens with
  the premise (the profession's specification vocabulary, kept without the ceremony), the
  spec–task–code–observation loop, the three ways in and the honest limits, and moves the
  rename/migration reference behind the product claim. The site names the same three arrivals
  between the problem and the mechanism. The advertised install version follows the released
  package again.

- **The executable work unit is now `task` on every current surface.** CLI commands, MCP tools,
  schemas, stored relationships, board data, templates, generated rules, shipped skills, docs and
  the site now use the specification's accepted vocabulary. Existing `T-` identifiers never change.
  `kotta migrate` upgrades version-3 workspaces to version 4, including batch membership,
  observation and claim links, event links and approval actions, and the workflow configuration.
  The former CLI group and read-only MCP list/show tools remain one-version compatibility aliases;
  reading their stored form emits a warning naming the migration. `kotta sync` installs the renamed
  skills and removes only legacy directories proven Kotta-owned by its manifest.

### Fixed

- The state-duplication and ui-port integration suites no longer depend on the environment: the
  duplicated-entity fixtures reconstruct both copies whatever the local git's rename detection
  decides, and the non-collision bind failure uses a TEST-NET address instead of a privileged
  port, so the suite passes as root and across git versions.

## [0.7.0] - 2026-08-20

### Added

- **A contract can name the specification it rests on.** A contract's frontmatter carries an
  optional `spec` list of specification node ids, accepted by `contract define` alongside the other
  definition fields and left empty by default, so the whole lifecycle runs exactly as before for a
  contract that names none. A reference that resolves is accepted; one that does not is refused by
  name at `contract define`, and `contract validate` reports it as `SPEC_NOT_FOUND` afterwards, so a
  node deleted after definition surfaces instead of rotting silently. The reference runs one way
  only: a contract names specification, specification never names a contract.
- **The brief carries the specification the contract was defined from.** `contract brief` appends
  each referenced node's full text as its own `## Specification <id> (<form>)` section, separate
  from the contract body, and names any it could not resolve under `## Missing specification`. An
  agent executing from a fresh context therefore receives the material the contract was written
  against, not just a reference to it.
- **`kotta validate` measures the specification against its own forms.** The form registry under
  `spec/forms/` is now enforced: a missing required frontmatter field, a missing required body
  heading, and an edge below its declared minimum are each reported with their file and their form,
  and a dangling edge is told apart from one that resolves to a node of the wrong form. A form the
  project adds participates on the same terms as a shipped one.

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
