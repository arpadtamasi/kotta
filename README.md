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

This first alpha is the foundation. It carries the form registry, the validator, the evidence
report, the draft scaffold, the read-only board and the calling-chat tools. The planning phase —
the narrative-to-model delta, the comparison with the accepted model, the questions it must ask
instead of inventing, and the one human gate at the end — the module boundaries, the narrative
distillate and the diagram views are the phases that follow; the OpenSpec change under
`openspec/changes/kotta-1-0-muszaki-spec-reteg/` is their source.

## Install

Node.js 20 or newer, Git, and a coding-agent host that reads skills from `~/.claude/skills`.

```bash
npm install --global @arpadtamasi/kotta@1.0.0-alpha.1
kotta --version
```

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
two branches can never mint the same one) and its form's skeleton: a section per required heading
and a field per outgoing edge, each with the form's own question beside it. It writes a draft and
commits nothing; a node becomes the agreement when it lands on the base branch on a human yes.

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
command is run.

The specification workshops draft with you, in conversation, and land nodes under `.kotta/spec/`:
`impact-mapping`, `story-mapping`, `use-case-modeling`, `example-mapping`, `event-storming`,
`ubiquitous-language`, `quality-scenarios`, `design-by-task`. `requirements-traceability` reads the
model as a graph and reports what hangs; `explore-workspace` answers questions across it;
`consolidate-model` finds one concept living under several names; `setup-kotta` initializes or
migrates a workspace; `report-kotta-bug` reports a defect in Kotta itself.

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

`config.yaml` is version 6 and names the project, the base branch and the protected branches.
There is no `process/`: no task, claim, batch, observation, decision or approval receipt exists,
and nothing in Kotta 1.0 reads or writes `legacy/`.

## The board and the calling chat

```bash
kotta ui              # the read-only board, served from the base branch through Git plumbing
```

The board lists every node grouped by form, counts the admissions apart, and opens a node with the
edges it answers and the nodes that answer it. It is a projection: it serves GET requests and
rejects every other method. Without `--port` it starts at 4311 and advances to the next free port;
`--no-open` prints the URL without opening a browser, and `--json` never opens one. It reads the
configured base branch, not the working tree, and says so above the list when the two differ.

`kotta mcp` serves the same reads to the calling chat over stdio: `spec_list`, `spec_show`,
`workspace_validate`, `workspace_questions` and `gap_report`. All of them are read-only; the chat
drafts a node in conversation and the human lands it. `kotta integrate codex` records the
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
allowlist, and exercises a clean install before publishing. The bump changes the install line the
rules file interpolates, so run `kotta sync` as part of the bump and commit what it writes.

Publishing is limited to the `arpadtamasi/kotta` repository, `.github/workflows/npm-release.yml`,
and the `npm-release` GitHub environment through npm Trusted Publishing. Published versions are
immutable: correct a bad one with a new version rather than an overwrite.

## License

MIT. See [LICENSE](LICENSE).
