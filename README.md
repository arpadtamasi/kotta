# Kotta

Kotta keeps the **technical specification** of a product beside its code: the accepted rules,
examples, entities, state machines, use cases, stories and interfaces, as plain Markdown files in
the repository, each in the shape its form declares — and it says which of those promises the code
keeps.

> The technical model is the accepted truth. The narrative proposes, the human decides, the code
> cites what it keeps.

[The visual guide to why Kotta exists.](https://arpadtamasi.github.io/kotta/)

> **1.0.0-alpha.1 is a breaking release.** The process engine of the 0.x releases — tasks, claims,
> worktrees, batches, review gates, observations, decision records — is gone. See
> [Migrating from 0.x](#migrating-from-0x) and the [changelog](CHANGELOG.md). The last pre-1.0
> release stays installable as `@arpadtamasi/kotta@0.11`.

## What Kotta is for

Four layers, joined by references and never by copies:

```text
chat  →  narrative spec (OpenSpec)  →  technical model (Kotta forms)  →  code
```

The conversation is where intent is said. The narrative specification — an OpenSpec change — is
where a change is proposed and argued in prose. The **technical model** is the precise,
machine-checkable form of what was accepted: when the narrative and the model disagree, the model is
the truth and the disagreement is reported rather than smoothed over. The code keeps the promises,
and says which by naming the node it keeps.

Kotta 1.0 owns the third layer. Measurements on real projects showed what prose alone loses: the
"what" and the "how" are said, the "why" and the "for whom" are not; structure cannot be recovered
from prose once round-tripped; a copied interface promise drifts between repositories; and the
machine decides, unnoticed, wherever a gap is filled in silently. The model is where those things
are held, and the tooling is what keeps the model honest.

This alpha carries the whole of it: the form registry and the validator, the planning phase with
its one human gate, the narrative generated from the model, module boundaries and evidence levels,
the distilled conversation, the OpenSpec import and the diagram views. The OpenSpec change under
`openspec/changes/kotta-1-0-muszaki-spec-reteg/` is the source of its decisions.

## Install

Node.js 20 or newer, Git, and a coding-agent host that reads skills from `~/.claude/skills`.

```bash
npm install --global @arpadtamasi/kotta@1.0.0-alpha.1   # or @arpadtamasi/kotta@next
kotta --version
```

A pre-release is published under the `next` dist-tag; a plain `@arpadtamasi/kotta` still installs the
last 0.x release.

In a repository that has no workspace yet:

```bash
kotta init            # the form registry, the rules file, the skills
kotta integrate codex # the read-only specification tools in the project-scoped Codex chat
```

`init` writes `.kotta/`, installs the shipped skills into the host's skill directory and writes
`.kotta/AGENTS.md` — the rules every agent in the project follows, with the install line rendered
from the package actually running. Your own `AGENTS.md` stays yours: `init` creates one carrying the
reference when there is none, and `kotta sync --link-agents` appends the reference to an existing
one only when you ask. Run `kotta sync` again after upgrading; it refreshes the skills, adds newly
shipped forms without touching yours, and reports a hand-edited rules file as drifted rather than
replacing it (`--replace-rules` takes Kotta's copy back).

## The model

Every node is one Markdown file with frontmatter: `id`, `form`, `title`, the fields its form
requires, and the edges it answers. The registry under `.kotta/spec/forms/` says which forms exist,
where their nodes live, which sections they must carry and which edges they must answer. Eleven
forms ship — goal, actor, use case, user story, business rule, example, entity, state machine,
interface, quality attribute, glossary term — and a form the project adds participates the same
way, with nothing compiled in.

```bash
kotta spec new use-case --title "Export a report"
```

mints a node already carrying its id (a time-sortable ULID under the prefix its form declares, so
two branches can never mint the same one) and its form's skeleton: a section per required heading,
a field per outgoing edge, each with the form's own question beside it, and an empty `provenance`
block. It writes a draft and commits nothing; a node becomes the agreement when it lands on the base
branch on a human yes — for a change, through the [planning phase](#the-planning-phase).

An obligation carries its keyword in the model: a business rule's Rule, an interface's
Postconditions or Invariants and a quality attribute's Response say SHALL or MUST (the form's
`normative_sections`). Missing, it is a warning on an accepted node and an error in a change's model.
Use cases and user stories stay free-form.

```bash
kotta validate        # every node against its form, every edge against the node it names
kotta questions       # the open decisions the drafts still carry, addressed as <id>/Q<n>
kotta gap             # which accepted promises have no evidence, and which enforcement has no spec
```

**A promise is evidenced by citation.** The code, test or command definition that keeps a node
names that node's id, and `kotta gap` finds it in one pass over the base branch. A node nothing
names either admits its gap in its frontmatter —

```yaml
accepted:
  - "unimplemented: the exporter ships after the policy workshop; nothing implements this yet"
```

— naming one of three kinds (`structural`: many sites realise it and none could name it;
`unexamined`: nobody has looked; `unimplemented`: someone looked and it is not built), or the
report refuses and names it. The report still prints in full when it refuses; that is why the
command is run. Every node gets an **evidence level**: `none`, `cited` (its id is named in the code)
or `bound` (its id is in a test's name; a skipped test does not bind). `kotta gap --module <name>`
narrows the report to one module.

**Modules come from the manifests** — npm and pnpm workspaces, `pyproject.toml`, `pubspec.yaml`,
Cargo, `go.mod` — and a node's module from where its evidence lives; nothing keeps a module list by
hand. `kotta modules` lists them; `kotta modules check` names a module with an outward surface but
no interface node, a node whose evidence straddles modules, and a reference that crosses a boundary
without going through an interface. A consumer names another repository's promise through a
`reference:` block on an interface node (`module`, `version`, `resolve`, optional `id` and `url`)
instead of copying it; the check reports a pin the core has moved past and a copy that has drifted.
`kotta modules publish-spec <module>` ships a module's interfaces, with the rules and examples bound
to them, in `<module>/kotta-spec/`.

The specification workshops draft with you, in conversation, and land nodes under `.kotta/spec/`:
`impact-mapping`, `story-mapping`, `use-case-modeling`, `example-mapping`, `event-storming`,
`ubiquitous-language`, `quality-scenarios`, `design-by-task`. `requirements-traceability` reads the
model as a graph and reports what hangs; `explore-workspace` answers questions across it;
`consolidate-model` finds one concept living under several names; `plan-change` carries a change
from its narrative to the one gate; `setup-kotta` initializes or migrates a workspace;
`report-kotta-bug` reports a defect in Kotta itself.

## The planning phase

A change is written in prose first, as an OpenSpec change, and translated into the model before it
lands. The layout, beside OpenSpec's own files:

```text
openspec/changes/<name>/
  proposal.md, specs/**                    the narrative
  conversation.md                          optional: the distilled conversation
  model/<form-directory>/<slug>-<id8>.md   a new node, or an accepted node changed under its own id
  model/REMOVED.md                         accepted nodes the change removes, with why
  planning.md                              written by kotta plan
  approval.yaml                            written by kotta approve
```

The `plan-change` skill does the translation in the chat: requirement by requirement, into the form
that states it, with a `provenance` block on every node — `level` (`stated`, `partly-inferred`,
`inferred`), `decided_by` (`human`, `agent-proposed-human-approved`, `agent-decided`), `sources`, a
`quote`, and what was `inferred`. Where no source says why, it writes a question, not an answer.

```bash
kotta narrative <name> --from <session log>   # optional: conversation.md from a Claude Code or Codex log
kotta spec new <form> --title "…" --into <name>
kotta plan <name>                             # writes planning.md
# the human reads the report and says yes in the chat
kotta approve <name> --by <who>               # the one gate, recorded as approval.yaml
kotta archive <name>                          # merge, regenerate the narrative, move to the archive
```

`planning.md` reports (a) the structure of the delta, (b) the merged view, (c) conflict candidates
against the accepted model, with a `judged` block for what the agent found itself, (d) silences —
the questions still open, (e) narrative drift and (f) provenance, listing everything the agent
decided on its own. `approve` refuses without a report, with a report older than the delta, with an
open question, or with a delta that does not validate. `archive` asks nothing again: it re-runs the
mechanical checks, merges the model into `.kotta/spec/`, regenerates each touched
`openspec/specs/<capability>/spec.md` from the nodes carrying that `capability:` — requirements with
SHALL/MUST from rules, interfaces and quality attributes, scenarios from examples, use cases and user
stories as informative sections, each bound by a `<!-- kotta: ID -->` comment — and moves the change
to `openspec/changes/archive/`. Drift left after regeneration refuses the archive; it is never
resolved silently. With `narrative: authored` in `.kotta/config.yaml` people write
`openspec/specs/` and archive only reports drift; `generated` is the default.

`kotta narrative` keeps who decided: the human's sentences of intent, each proposal with the answer
it got, the paths turned down, the questions. Secrets, e-mail addresses, phone numbers and home
directories are filtered before anything is written, and a hand-edited distillate is never
overwritten.

An existing OpenSpec repository comes in the same way: `kotta import openspec [--change <name>]`
drafts its requirements, scenarios and purposes into a change's model, every node marked
`agent-decided`, and `kotta plan` then lists what the prose never said.

## Commands

| Command | What it does |
| --- | --- |
| `kotta init` | create a workspace: the form registry, the rules file, the skills |
| `kotta sync` | refresh the skills, add newly shipped forms, refresh the rules file |
| `kotta migrate [--dry-run]` | carry a pre-1.0 workspace to version 6 |
| `kotta validate` | every node against its form, every edge against the node it names; open changes' nodes too |
| `kotta questions [id]` | the open questions a draft asks, or every draft's |
| `kotta spec new <form> [--into <change>]` | mint and scaffold a node, in the spec or in a change's model |
| `kotta gap [--module <name>]` | accepted promises without evidence, with evidence levels |
| `kotta modules` · `modules check` · `modules publish-spec <module>` | modules, boundaries and cross-repository references |
| `kotta plan <change>` | measure a change's model delta and write `planning.md` |
| `kotta approve <change> --by <who>` | record the human's yes: the one gate |
| `kotta archive <change>` | land an approved change and regenerate the narrative |
| `kotta narrative <change> --from <path> [--since <time>]` | distil a session log into `conversation.md` |
| `kotta import openspec [--change <name>]` | draft an OpenSpec project into a change's model |
| `kotta ui` | the read-only board |
| `kotta mcp` | the read-only specification tools over stdio MCP |
| `kotta integrate codex` | connect those tools to the project-scoped Codex chat |
| `kotta doctor` | whether `kotta` resolves where the work happens |

Every command takes `--json`, except `kotta mcp`.

## Workspace layout

```text
.kotta/
  AGENTS.md  README.md  config.yaml  .kotta-generated.json
  spec/        # project-owned: the form registry and the nodes
    forms/
    <form directory>/
  legacy/      # only after a migration: the pre-1.0 process state, read-only
    README.md
    process/
```

`config.yaml` is version 6 and names the project, the base branch and the protected branches, and
optionally `narrative: generated | authored`. There is no `process/`: no task, claim, batch,
observation or decision record exists; the one receipt left is a change's `approval.yaml`, under
`openspec/`. Nothing in Kotta 1.0 reads or writes `legacy/`.

## The board and the calling chat

```bash
kotta ui              # the read-only board, served from the base branch through Git plumbing
```

The board lists every node grouped by form, counts the admissions apart, and opens a node with the
edges it answers and the nodes that answer it. Beside the list it draws the model: the use case
diagram, the story map, the entity map and the state machines. Every node carries its provenance
badges, one filter shows only what the agent decided, and a node whose provenance cites a
distilled conversation opens that exchange. It is a projection: it serves GET requests and
rejects every other method. Without `--port` it starts at 4311 and advances to the next free port;
`--no-open` prints the URL without opening a browser, and `--json` never opens one. It reads the
configured base branch, not the working tree, and says so above the list when the two differ.

`kotta mcp` serves the same reads to the calling chat over stdio: `spec_list`, `spec_show`,
`workspace_validate`, `workspace_questions` and `gap_report`. All of them are read-only; the chat
drafts in conversation, and a change lands through `plan`, the human's yes and `archive`. `kotta integrate codex` records the
project-scoped MCP configuration with the interpreter and entry point that are running, so a host
spawning Kotta from a non-interactive shell finds it; `kotta doctor` says whether the bare name
`kotta` resolves in such a shell.

## Migrating from 0.x

Kotta 1.0 keeps no compatibility layer. Every command on a workspace of an older shape — versions 1
to 5, whether under `.kotta/` or the pre-rename `.a-team/` — refuses, names the migration, and does
nothing else:

```bash
kotta migrate --dry-run    # every change it would make; writes nothing
kotta migrate              # the same list, applied
```

What it does, in one run from any older shape:

| What | Where it goes |
| --- | --- |
| `process/` — tasks, observations, batches, claims, events, decisions, profiles, the generated index | `legacy/process/`, moved with `git mv` where Git tracks it, **untouched** |
| a v1–v4 shape (state directories, `findings/`, `packages/`, the old field names) | carried to the v5 shape on its way into the archive, so every archive reads alike |
| `config.yaml` | version 6: project, base branch, protected branches, `validation.strict`; every process key dropped and named in the plan |
| `.kotta/README.md`, `.kotta/AGENTS.md` | this Kotta's copies; a hand-edited rules file is reported and left alone |
| `.gitattributes` | the generated index's merge attribute removed; the file is deleted when that was all it held |
| `spec/` | **byte-identical**, and the command proves it after writing; a workspace with no registry at all gets the bundled one |

`legacy/README.md` says what the archive is and which shape wrote it. No identifier moves — the
command compares the id set before and after and refuses to lose one. A completed run is
idempotent: the second run reports "already on the current shape". A workspace *newer* than the
Kotta reading it is named as newer, with both versions stated, and answered by upgrading Kotta;
migration only ever carries a workspace forward.

Commit the migration before you read the board: it reads the base branch, and the pre-migration
files stay there until the commit lands.

## Report a bug

Defects in Kotta itself go to
[the issue form in `arpadtamasi/kotta`](https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml):
the `Report a bug` link on the public site and in the board's rail, or the installed
`report-kotta-bug` skill, which inspects evidence, searches open issues for duplicates, sanitizes
the draft and shows you the exact title and body before asking to create the issue. Every path
reports the same five fields: summary, reproduction steps, expected behaviour, actual behaviour and
Kotta version. Optional diagnostics (Node.js and OS version, the redacted failing command output,
the redacted `--json` error payload) are off by default and
require a separate per-report opt-in after the exact fields are shown. Kotta stores no GitHub
credential, and reporting never touches your workspace.

A maintainer reads an incoming issue against the specification: a defect against a node the model
promises, or a proposal for a node it does not yet have. An issue never changes a node by itself.

## Tests

`npm test` builds, then runs the whole vitest suite: `tests/unit` and `tests/integration` drive the
built CLI in Node; `tests/ui` renders the React board with `@testing-library/react` in `jsdom`,
opted into per file with `// @vitest-environment jsdom`. `site/tests` is the separate Playwright
suite, run with `npm run test:site`.

## Maintainer releases

`package.json#version` is the only release version source. Merge a reviewed version bump to
`main`, then create `v<version>` on that exact commit. The `npm release` workflow rejects a
tag/version mismatch or a commit outside `main`, runs the full tests, inspects the packed
allowlist, and exercises a clean install before publishing. A version carrying a pre-release suffix
(anything with a `-`, such as `1.0.0-alpha.1`) is published under the `next` dist-tag, never as
`latest`: it is installed by its exact version or as `@arpadtamasi/kotta@next`, and a plain install
keeps getting the last stable release. The bump changes the install line the
rules file interpolates, so run `kotta sync` as part of the bump and commit what it writes.

Publishing is limited to the `arpadtamasi/kotta` repository, `.github/workflows/npm-release.yml`,
and the `npm-release` GitHub environment through npm Trusted Publishing. Published versions are
immutable: correct a bad one with a new version rather than an overwrite.

## License

MIT. See [LICENSE](LICENSE).
