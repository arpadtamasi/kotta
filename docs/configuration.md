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
| `version` | yes | `6` | the workspace shape. Any other value is refused and names `kotta migrate` (older) or an upgrade (newer) |
| `project.name` | yes | string | shown on the board; `init --project-name` sets it, else the directory name |
| `git.base_branch` | yes | string | the branch the accepted model is read from: `kotta gap` and `kotta ui` read it through Git, never the working tree. Default `main` |
| `git.protected_branches` | yes | list of strings | kept by `init` and `migrate`; the base branch is always among them. No 1.0 command acts on it |
| `validation.strict` | yes | boolean | kept by `init` and `migrate`; no 1.0 command reads it |
| `narrative` | no | `generated` or `authored` | who writes `openspec/specs/`, below |

## `narrative: generated | authored`

| Value | `kotta archive` |
| --- | --- |
| `generated` (default) | regenerates `openspec/specs/<capability>/spec.md` for every capability the change touches, from the merged model; refuses while a bound requirement still disagrees with its node |
| `authored` | writes nothing under `openspec/specs/`; reports each bound requirement that disagrees with its node as a warning and lands the change anyway |

Kotta looks for the key in `.kotta/config.yaml` first and in `openspec/config.yaml` second, and
takes `generated` when neither sets it. Any other value is an error (`CONFIG_INVALID`), never a
silent default. In either mode the model is the accepted truth; `authored` only decides who writes
the prose. See [The planning phase](planning-phase.md#what-archive-generates).

## Environment

| Variable | Effect |
| --- | --- |
| `KOTTA_SKILLS_HOME` | where `init` and `sync` install the skills, instead of `~/.claude/skills` |
| `KOTTA_UI_OPEN_COMMAND` | the command `kotta ui` hands the URL to, instead of `open`, `xdg-open` or `start` |

The pre-rename `A_TEAM_` prefix of each variable is still read.

## Files Kotta writes elsewhere

| File | Written by |
| --- | --- |
| `.kotta/AGENTS.md` | `init`, `sync`, `migrate`: the rules file, from Kotta's template. A hand-edited copy is reported as drifted and left alone |
| `AGENTS.md` | `init`, only when there is none; `--link-agents` appends the pointer to an existing one |
| `.codex/config.toml` | `integrate codex`: an `[mcp_servers.kotta]` block, never rewritten once present |
| `~/.claude/skills/<skill>/` | `init`, `sync`: the shipped skills, with `.kotta-installed.json` recording which ones Kotta owns |
