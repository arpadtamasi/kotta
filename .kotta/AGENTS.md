# AGENTS.md

This repository runs on **Kotta**. Work is defined, executed, reviewed and closed as plain files
in `.kotta/`, and every state change goes through Kotta's validated services via calling-chat MCP tools or
the `kotta` CLI fallback. Read this before you touch
anything.

## The tool these rules assume

The rules below are enforced by the `kotta` CLI and by the Kotta MCP server. The binary and the npm
package do not share a name, so the package cannot be guessed from the command:

```bash
npm install --global @arpadtamasi/kotta@0.5.0   # or: npx -y -p @arpadtamasi/kotta@0.5.0 kotta status
```

If you can install neither — a hosted environment with no network or no npm — you still do not
hand-edit `.kotta/`. Read the state, prepare the work in a file, say what you could not do, and
leave every lifecycle change to an environment that has one of the two surfaces.

## The rule everything else follows from

`.kotta/` is the canonical source of truth for work: contracts, observations, batches, lifecycle
state, claims and decisions. Chat, the board (`kotta ui`), pull requests and CI are views or
history — they never override `.kotta/`. The board is read-only. Never hand-edit workspace files;
use the calling chat's Kotta MCP tools for actions and human approvals, and the CLI for automation
and recovery. Both validate before writing and name the
violated rule when they refuse.

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
| Capture intent | `kotta contract new --title "…" --type <type> [--profile …]` | human, or agent if allowed by config |
| Formalize | `kotta contract define <id> --from <file>` then `kotta contract validate <id>` | agent |
| Approve for execution | `kotta contract sign <id> --approve`, after the human said yes in chat | **human decides** (rule 5) |
| Execute | `kotta contract execute <id> --agent <agent>` | agent, in its own claim + branch + worktree |
| Submit | `kotta contract review <id> --evidence "…" --pull-request <ref>` | agent |
| Close | `kotta contract close <id> --approve`, after the human said yes in chat | **human decides** (rule 5) |
| Retire | `kotta contract cancel <id> --resolution <resolution> --reason "…" [--superseded-by <id>] --approve`, after the human said yes in chat | **human decides** (rule 5) |

`contract execute` does the start, builds the brief and launches a fresh agent context whose only
input is `kotta contract brief <id>`. Resume an interrupted or failed run with `--resume`; a second
plain `execute` is refused rather than starting a second agent.

`contract start --caller` is the explicit inherited-context alternative. It returns the isolated
worktree to the current caller without launching another agent. Fresh remains the default.

A contract with no unresolved choice may use `None`, `N/A`, or `No open decisions` (with or
without a final period) under `Open decisions`. Any substantive text there blocks signing.

A batch may group other batches — `kotta batch add <parent> <child>` takes either kind of member.
Nesting is grouping only: a child has no coordinator branch and no execution of its own, and
`batch start` runs leaf batches, never a parent. To carry out a whole parent, read it with
`kotta batch status <id>`, which reports every contract underneath it in dependency order, and work
that list. Each contract keeps its own human gates; grouping approves nothing.

`close` ends work that was finished and merged; `cancel` ends work whose purpose is gone, from any
state before `done`, and it is the only exit for a contract a decision made objectless. It always
records why, and `duplicate` and `obsolete` also require the contract or decision that took the
work's place. It releases the claim and removes the execution worktree, and never deletes the
branch. Do not close such a contract as completed and do not leave it sitting in `active`.

Canonical live state, claims and visible conversation stay on `git.base_branch`; implementation
worktrees contain code and their original baseline, not a divergent lifecycle copy. Commands invoked
from any linked worktree route state changes back to the checked-out control worktree.

Where there is only one checkout — a hosted session, or a repository with no linked worktrees — that
checkout is the control plane, on whatever branch it holds. If that branch is not a protected one,
`start` adopts it instead of creating a second branch and worktree, and records that it created
neither, so `close` and `cancel` leave the environment's branch and checkout in place.

Never ask the human to copy an id or go and run a command. Whatever the surface, you drive it: the
CLI is the whole interface, and where the Kotta MCP server is available its structured tools are an
equivalent path to the same services. `contract_start_caller` is the inherited-context start path.
`approval_request` is one way to put a decision to the human, and rule 5 is the other; if the
elicitation is unavailable or refused by the host, ask in plain chat rather than falling back to the
terminal. `kotta ui` only displays the resulting canonical state and timeline.

## Rules for agents

1. **No change without an active contract you hold the claim for.** If there is no contract, the
   work is not defined yet — say so instead of starting.
2. **Stay inside the contract's scope.** Anything you notice outside it becomes an observation, not
   a silent fix: `kotta observation new --title "…" --type <type> --evidence "…"`.
3. **An observation is not a contract.** It is dispositioned by `kotta observation validate <id>`
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
6. **One active contract = one claim, one feature branch, one worktree.** Parallel work uses
   separate worktrees. Never execute on a protected branch.
7. **Review needs acceptance-to-evidence mapping**; closing needs accepted review, integration and
   verified acceptance conditions.
8. **Execute from the brief unless `--caller` was explicit.** If the brief plus the code in the worktree is not enough to finish
   the contract, the contract is incomplete — record the gap; do not widen your context.

## Skills

If the Kotta skills are installed, prefer them — they encode the how: `explore-workspace`,
`setup-kotta`, `define-contract`, `validate-observation`, `start-contract`, `execute-contract`,
`execute-batch`, `submit-review`, `close-contract`, `consolidate-model`, `report-kotta-bug`. If they are not installed,
the CLI above is the whole contract; nothing depends on the skills being present. `kotta sync`
installs them.

A defect in Kotta itself is not a contract here: use `report-kotta-bug`, or the issue form at
<https://github.com/arpadtamasi/kotta/issues>.

---

This file is written and kept current by Kotta. Edit it and `kotta sync` will report it as drifted
and leave it alone; project-specific instructions belong in the repository's own `AGENTS.md`, which
Kotta never rewrites.
