# Configuration

What `.kotta/config.yaml` holds, what reads each key, and the one setting OpenSpec may carry.

## `.kotta/config.yaml`

`kotta init` writes:

```yaml
version: 6

project:
  name: example-project

git:
  base_branch: main
  protected_branches:
    - main
    - master
    - develop

validation:
  strict: true
```

The schema is published as `schemas/config.schema.json`. No other key is allowed.

| Key | Required | Type | What it does |
| --- | --- | --- | --- |
| `version` | yes | `6` | the workspace shape. Any other value is refused: an older one names the last release that migrates it (`@arpadtamasi/kotta@1.0.0-alpha.4`), a newer one an upgrade |
| `project.name` | yes | string | shown on the board; `init --project-name` sets it, else the directory name |
| `git.base_branch` | yes | string | the branch the accepted model is read from: `kotta gap` and `kotta ui` read it through Git, never the working tree. Default `main` |
| `git.protected_branches` | yes | list of strings | written by `init`; the base branch is always among them. No 1.0 command acts on it |
| `validation.strict` | yes | boolean | written by `init`; no 1.0 command reads it |
| `narrative` | no | `none`, `generated` or `authored` | whether the project keeps an OpenSpec narrative, and who writes it; below |

## `narrative: none | generated | authored`

| Value | `kotta archive` |
| --- | --- |
| `none` (default) | writes and checks nothing under `openspec/`: the model is the only specification. `kotta plan` reports no narrative drift, and no obligation needs SHALL or MUST |
| `generated` | regenerates `openspec/specs/<capability>/spec.md` for every capability the change touches, from the merged model; refuses while a bound requirement still disagrees with its node |
| `authored` | writes nothing under `openspec/specs/`; reports each bound requirement that disagrees with its node as a warning and lands the change anyway |

Kotta looks for the key in `.kotta/config.yaml` first and in `openspec/config.yaml` second, and
takes `none` when neither sets it. Any other value is an error (`CONFIG_INVALID`), never a silent
default. In every mode the model is the accepted truth and a change lives under `.kotta/changes/`;
the setting only decides whether OpenSpec prose is kept beside it and who writes it.

With `generated` or `authored`, an obligation carries OpenSpec's keyword: a rule, an interface's
postconditions or invariants and a quality attribute's response say SHALL or MUST, in English
whatever the language around it. `validate` and `plan` refuse a change's node without it and warn
about an accepted one; `spec new` lays the hint into those sections. With `none` they write the
obligation plainly, in the project's language.

Before 1.0.0-alpha.3 an unset key meant `generated`. `kotta validate` warns `NARRATIVE_UNSET` when
`openspec/specs/` holds specs and nothing sets the key, and `kotta migrate` writes
`narrative: generated` in that case, so archive keeps doing what it did. See
[The planning phase](planning-phase.md#what-archive-generates) and [Kotta and OpenSpec](openspec.md).

## Environment

| Variable | Effect |
| --- | --- |
| `KOTTA_SKILLS_HOME` | where `init` and `sync` install the skills, instead of `~/.claude/skills` |
| `KOTTA_UI_OPEN_COMMAND` | the command `kotta ui` hands the URL to, instead of `open`, `xdg-open` or `start` |

The pre-rename `A_TEAM_` prefix of each variable is still read.

## Files Kotta writes elsewhere

| File | Written by |
| --- | --- |
| `.kotta/AGENTS.md` | `init`, `sync`: the rules file, from Kotta's template. A hand-edited copy is reported as drifted and left alone |
| `AGENTS.md` | `init`, only when there is none; an existing one is never written |
| `.codex/config.toml` | `integrate codex`: an `[mcp_servers.kotta]` block, never rewritten once present |
| `~/.claude/skills/<skill>/` | `init`, `sync`: the shipped skills, with `.kotta-installed.json` recording which ones Kotta owns |
