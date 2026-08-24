# AGENTS.md

This repository runs on **Kotta**. Work is defined, executed, reviewed and closed as plain files
in `.kotta/`, and every state change goes through Kotta's validated services via calling-chat MCP tools or
the `kotta` CLI fallback. Read this before you touch
anything.

## The tool these rules assume

The rules below are enforced by the `kotta` CLI and by the Kotta MCP server. The binary and the npm
package do not share a name, so the package cannot be guessed from the command:

```bash
npm install --global @arpadtamasi/kotta@0.9.0   # or: npx -y -p @arpadtamasi/kotta@0.9.0 kotta status
```

If you can install neither — a hosted environment with no network or no npm — you still do not
hand-edit `.kotta/`. Read the state, prepare the work in a file, say what you could not do, and
leave every lifecycle change to an environment that has one of the two surfaces.

## The rule everything else follows from

`.kotta/` is the canonical source of truth, with two deliberately different ownership
boundaries. `.kotta/spec/` is project-owned specification knowledge: its form registry and
the nodes stored in form-declared directories may be shaped directly. `.kotta/process/` is
Kotta-owned execution and lifecycle state: tasks, observations, batches, profiles, claims,
events, decisions, and the generated index. Chat, the board (`kotta ui`), pull requests and CI are
views or history — they never override these files. The board is read-only. Never hand-edit
`process/`; use the calling chat's Kotta MCP tools for actions and human approvals, and the CLI for
automation and recovery. Both validate before writing and name the violated rule when they refuse.

## Orient yourself first

```bash
kotta status      # defined / active / review / blocked, and new observations
kotta validate    # is the workspace consistent
```

Project-specific settings — approval gates, base and protected branches, worktree policy, batch
parallelism — live in `.kotta/config.yaml`. Read it rather than assuming defaults.

## The lifecycle

```text
backlog → defined → active → review → done
```

| Step | Command | Who |
| --- | --- | --- |
| Capture intent | `kotta task new --title "…" --type <type> [--profile …]` | human, or agent if allowed by config |
| Formalize | `kotta task define <id> --from <file>`; every acceptance condition maps to a referenced accepted spec node | agent; valid coverage moves it to `defined` |
| Execute | `kotta task execute <id> --agent <agent>` | agent, in its own claim + branch + worktree |
| Submit | `kotta task review <id> --evidence "<exact check>=<evidence>" --pull-request <ref>` (repeat evidence per check) | agent |
| Close | `kotta task close <id> --approve`, after the human said yes in chat | **human decides** (rule 5) |
| Retire | `kotta task cancel <id> --resolution <resolution> --reason "…" [--superseded-by <id>] --approve`, after the human said yes in chat | **human decides** (rule 5) |

`task execute` does the start, builds the brief and launches a fresh agent context whose only
input is `kotta task brief <id>`. Resume an interrupted or failed run with `--resume`; a second
plain `execute` is refused rather than starting a second agent.

`task start --caller` is the explicit inherited-context alternative. It returns the isolated
worktree to the current caller without launching another agent. Fresh remains the default.

A task with no unresolved choice may use `None`, `N/A`, or `No open decisions` (with or
without a final period) under `Open decisions`. Any substantive text there blocks defining.
Coverage is named, never inferred: each acceptance bullet either contains a referenced spec id or
has an exact-text entry in frontmatter `coverage` mapping it to one or more ids from `spec`. If the
accepted specification does not promise a condition, record an observation and amend the spec;
never widen the task to make the validator pass. The validated coverage map travels in the brief.

A batch may group other batches — `kotta batch add <parent> <child>` takes either kind of member.
Nesting is grouping only: a child has no coordinator branch and no execution of its own, and
`batch start` runs leaf batches, never a parent. To carry out a whole parent, read it with
`kotta batch status <id>`, which reports every task underneath it in dependency order, and work
that list. Each task keeps its close gate (and any configured compatibility gate); grouping approves nothing.

Inside a running leaf batch, technical dependency readiness is separate from human acceptance. A
dependency can release the next wave when it is `done`, or when it is in `review` and Git proves its
feature branch is already in that batch's coordinator branch. `batch start` creates every newly
released member from the coordinator's current commit and reports that exact baseline. This never
approves or closes the reviewed predecessor; standalone `task start` still requires dependencies
to be `done`, and every `review → done` transition still needs the human gate.

`close` ends work that was finished and merged; `cancel` ends work whose purpose is gone, from any
state before `done`, and it is the only exit for a task a decision made objectless. It always
records why, and `duplicate` and `obsolete` also require the task or decision that took the
work's place. It releases the claim and removes the execution worktree, and never deletes the
branch. Do not close such a task as completed and do not leave it sitting in `active`.

Canonical live state, claims and visible conversation stay on `git.base_branch`; implementation
worktrees contain code and their original baseline, not a divergent lifecycle copy. Commands invoked
from any linked worktree route state changes back to the checked-out control worktree.

Where there is only one checkout — a hosted session, or a repository with no linked worktrees — that
checkout is the control plane, on whatever branch it holds. If that branch is not a protected one,
`start` adopts it instead of creating a second branch and worktree, and records that it created
neither, so `close` and `cancel` leave the environment's branch and checkout in place.

Never ask the human to copy an id or go and run a command. Whatever the surface, you drive it: the
CLI is the whole interface, and where the Kotta MCP server is available its structured tools are an
equivalent path to the same services. `task_start_caller` is the inherited-context start path.
`approval_request` is one way to put a decision to the human, and rule 5 is the other; if the
elicitation is unavailable or refused by the host, ask in plain chat rather than falling back to the
terminal. `kotta ui` only displays the resulting canonical state and timeline.

## Rules for agents

1. **A task gates execution of an accepted commitment.** Use an active task you hold the
   claim for when the work executes a product or deliverable commitment a human has accepted and
   whose outcome can be checked against acceptance conditions. Shaping, exploration, and
   specification may run without a task while they are discovering or proposing that
   commitment; they require one when the specification itself is the accepted deliverable or the
   work crosses into executing the accepted outcome. Keeping Kotta itself working — installing it,
   syncing it, migrating a workspace, repairing drift — never needs one either: Kotta is the
   project's tool, not its deliverable, so its upkeep is not the project's work and is not recorded
   as if it were. Purpose and effect decide, not path or file type. If it is unclear whether a commitment has been accepted, ask one focused question. Always
   obey stricter project rules, freely shape project-owned `spec/` nodes, and never hand-edit
   Kotta-owned `process/` records.
2. **Stay inside the task's scope.** Anything you notice outside it becomes an observation, not
   a silent fix: `kotta observation new --title "…" --type <type> --evidence "…"`.
3. **An observation is not a task.** It is dispositioned by `kotta observation validate <id>`
   and a human-approved `kotta observation resolve <id> --disposition <disposition> --approve`.
4. **Do not invent product intent or accepted trade-offs.** Ask the human. Durable answers are
   recorded with `kotta decision create --from <file> --approve`.
5. **Approval is a human gate — ask for it here, in the conversation.** Put the decision to the
   human in chat, in their language: what will happen, named by **title**, one line, then a plain
   yes or no. Never an id, never a command for them to go and run. On an explicit yes **in this
   conversation, for this exact decision**, you may run the command with `--approve` yourself; the
   receipt Kotta records is what makes it durable. Anything less than an explicit yes is a no:
   silence, a yes to a different question, an earlier unrelated yes, or your own judgement that
   they would obviously agree. If you cannot ask — no human is present — you do not approve.
6. **One active task = one claim, one feature branch, one worktree.** Parallel work uses
   separate worktrees. Never execute on a protected branch.
7. **Review needs acceptance-to-evidence mapping**; closing needs accepted review, integration and
   verified acceptance conditions.
8. **Execute from the brief unless `--caller` was explicit.** If the brief plus the code in the worktree is not enough to finish
   the task, the task is incomplete — record the gap; do not widen your context.

## Skills

If the Kotta skills are installed, prefer them — they encode the how: `explore-workspace`,
`setup-kotta`, `define-task`, `validate-observation`, `start-task`, `execute-task`,
`execute-batch`, `submit-review`, `close-task`, `consolidate-model`, `report-kotta-bug`. If they are not installed,
the CLI above is the whole task; nothing depends on the skills being present. `kotta sync`
installs them.

For optional specification workshops and analysis, use `impact-mapping`, `story-mapping`,
`use-case-modeling`, `example-mapping`, `event-storming`, `ubiquitous-language`,
`quality-scenarios`, `design-by-task`, and `requirements-traceability`. They draft and read
Markdown specification nodes under `.kotta/spec/`; landing those nodes is how agreement is
accepted, while the workshop skills themselves perform no lifecycle transition.

A defect in Kotta itself is not a task here: use `report-kotta-bug`, or the issue form at
<https://github.com/arpadtamasi/kotta/issues>.

---

This file is written and kept current by Kotta. Edit it and `kotta sync` will report it as drifted
and leave it alone; project-specific instructions belong in the repository's own `AGENTS.md`, which
Kotta never rewrites.
