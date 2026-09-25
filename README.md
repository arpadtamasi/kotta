# Kotta

Kotta keeps the **technical specification** of a product beside its code: the accepted rules,
examples, entities, state machines, use cases, stories and interfaces, as plain Markdown files in
the repository, each in the shape its form declares — and it says which of those promises the code
keeps.

> The technical model is the accepted truth. The narrative proposes, the human decides, the code
> cites what it keeps.

[Documentation](docs/README.md) · [The visual guide](https://arpadtamasi.github.io/kotta/) ·
[Changelog](CHANGELOG.md)

> **1.0.0-alpha.1 is a breaking release.** The process engine of the 0.x releases — tasks, claims,
> worktrees, batches, review gates, observations, decision records — is gone. See
> [Migrating from 0.x](docs/migration.md) and the [changelog](CHANGELOG.md). The last pre-1.0
> release stays installable as `@arpadtamasi/kotta@0.11`.

## What Kotta is

Four layers, joined by references and never by copies:

```text
chat  →  narrative spec (OpenSpec)  →  technical model (Kotta forms)  →  code
```

The conversation is where intent is said; an OpenSpec change is where it is proposed and argued in
prose; the **technical model** is the precise, machine-checkable form of what was accepted; the code
keeps the promises and names the node it keeps. Kotta owns the third layer. Every node says where it
came from and who decided it, a change lands on one human yes, and when the prose and the model
disagree, the disagreement is reported rather than smoothed over. See [Concepts](docs/concepts.md).

## Install

Node.js 20 or newer, Git, and a coding-agent host that reads skills from `~/.claude/skills`.

```bash
npm install --global @arpadtamasi/kotta@1.0.0-alpha.1   # or @arpadtamasi/kotta@next
kotta --version
```

A pre-release is published under the `next` dist-tag; a plain `@arpadtamasi/kotta` still installs the
last 0.x release.

## Ten minutes

```bash
kotta init                                   # the form registry, the rules file, the skills
kotta integrate codex                        # optional: the read-only tools in Codex's project chat
# write openspec/changes/<name>/proposal.md, the way you write OpenSpec changes
kotta narrative <name> --from <session log>  # optional: who decided what, into conversation.md
/plan-change                                 # in the chat: the prose becomes model nodes, with provenance
kotta plan <name>                            # measure the delta; writes planning.md
# the agent puts the delta to you; you say yes in the chat
kotta approve <name> --by <you>              # the one gate, recorded as approval.yaml
kotta archive <name>                         # merge the model, regenerate openspec/specs, archive the change
kotta ui                                     # the read-only board, after you commit
```

The whole walkthrough, on a real project: [Getting started](docs/getting-started.md).

## Kotta or OpenSpec alone

OpenSpec alone is enough for a small change, worked alone, where the requirements and scenarios say
everything the code needs. Add Kotta when the product has rules, states and interfaces that must
survive many changes; when an agent fills in gaps and you need to see which decisions it made alone;
or when modules and repositories rely on one another's promises. Writing a delta as nodes takes
longer than prose; that is the price. See [Kotta and OpenSpec](docs/openspec.md).

## Documentation

- [Getting started](docs/getting-started.md) — install and the first change
- [Concepts](docs/concepts.md) — the four layers, provenance, the one gate, evidence
- [The planning phase](docs/planning-phase.md) — `plan`, `approve`, `archive`, and every refusal
- [Kotta and OpenSpec](docs/openspec.md) — the binding, generated specs, `kotta import openspec`
- [The distilled conversation](docs/narrative.md) — `kotta narrative`
- [Modules and evidence](docs/modules-and-evidence.md) — `kotta modules`, `kotta gap`
- [The board](docs/board.md) — `kotta ui`
- [Migrating from 0.x](docs/migration.md) — `kotta migrate`
- [CLI reference](docs/cli.md) · [Forms](docs/forms.md) · [Configuration](docs/configuration.md) ·
  [Agents and skills](docs/agents.md)

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

`package.json#version` is the only release version source. Merge a reviewed version bump to `main`
(run `kotta sync` as part of it and commit what it writes: the rules file interpolates the version),
then create `v<version>` on that exact commit. The `npm release` workflow rejects a tag/version
mismatch or a commit outside `main`, runs the full tests, inspects the packed allowlist, and
exercises a clean install before publishing through npm Trusted Publishing. A version with a
pre-release suffix (such as `1.0.0-alpha.1`) is published under the `next` dist-tag, never as
`latest`. Published versions are immutable: correct a bad one with a new version.

## License

MIT. See [LICENSE](LICENSE).
