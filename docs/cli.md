# CLI reference

Every `kotta` command and option, as `kotta <command> --help` prints them in 1.0.0-alpha.1, grouped
by what you use them for.

## Conventions

- **`--json`** (on every command except `mcp`, and on the leaf subcommands of `spec`, `modules` and
  `import`) prints the result as one JSON object: `ok`, `command`, `data`, and the `errors` that made
  it fail.
- **Exit codes.** A command exits 1 when its result is not `ok` or when it throws (a missing change,
  an unknown module, a pre-1.0 workspace); otherwise 0. `gap` and `plan` still print their whole
  report when they exit 1: the report is why you ran them.
- **Nothing commits.** No command runs `git commit`.
- **A pre-1.0 workspace** is refused by every command except `init` and `migrate`, with a message
  naming `kotta migrate`.

## Set up and upkeep

| Command | Description |
| --- | --- |
| `kotta init [options]` | Create a .kotta workspace: the form registry, the rules file, the skills |
| `kotta sync [options]` | Install the skills Kotta ships, add newly shipped forms, and refresh the workspace rules file |
| `kotta migrate [options]` | Carry a pre-1.0 workspace to version 6: the process state into a read-only legacy/ archive, the specification untouched |
| `kotta integrate [options] <host>` | Connect Kotta's specification tools to a calling agent host |
| `kotta doctor [options]` | Report whether Kotta is reachable from where its work happens |

- `init --project-name <name>`: the project name written to `config.yaml`; without it, the
  repository directory's name.
- `init --link-agents`, `sync --link-agents`: Link the project's AGENTS.md to the workspace rules,
  migrating a recognized legacy Kotta prelude after the human said yes. Without it, `init` creates an
  `AGENTS.md` only when there is none, and `sync` prints the line to add.
- `sync --replace-rules`: Discard local edits to the workspace rules file and take Kotta's copy;
  without this an edited file is never replaced.
- `migrate --workspace <path>`: Repository root or workspace directory; omitted uses the repository
  around the cwd.
- `migrate --dry-run`: Report every change without writing anything.
- `integrate <host>`: Supported host: codex. Any other host is an error.
- `doctor` exits 1 when the bare name `kotta` resolves to nothing on this `PATH`
  (`BARE_NAME_UNRESOLVED`), and names the full invocation to use instead.

## Read the specification

| Command | Description |
| --- | --- |
| `kotta validate [options]` | Validate the specification: every node against its form, every edge against the node it names |
| `kotta questions [options] [id]` | Report the open questions a specification draft asks, or every draft's at once |
| `kotta gap [options]` | Report accepted spec promises without repository evidence and enforcement without a spec trace |
| `kotta modules [options] [command]` | List the modules the manifests declare; check their boundaries; publish a module's promises |
| `kotta modules check [options]` | Check module boundaries and cross-repository references: missing interfaces, straddling nodes, references across a boundary, stale pins, drifted copies |
| `kotta modules publish-spec [options] <module>` | Copy a module's interface nodes and the rules and examples bound to them into `<module>/kotta-spec/`, to ship with the package |

- `validate` also measures every open change's `model/` nodes on their own (provenance required,
  SHALL/MUST required) and prints warnings that do not fail it: accepted nodes without the keyword,
  and module-boundary warnings.
- `questions [id]`: one node's questions, or every node's, each addressed as `<id>/Q<n>`.
- `gap --module <name>`: Report only the promises of one module: those evidenced in it, and the
  interfaces naming it. `gap` exits 1 while a promise has neither evidence nor an admission.
- `modules check` exits 1 only on an error (`MODULE_UNKNOWN`, `MODULE_REFERENCE_INVALID`); the
  rest are warnings.
- `modules publish-spec <module>`: A module name the manifests declare.

See [Modules and evidence](modules-and-evidence.md).

## Plan and land a change

| Command | Description |
| --- | --- |
| `kotta spec new [options] <form>` | Mint and scaffold a specification node from its registered form |
| `kotta narrative [options] <change>` | Distil an agent session log into the change's conversation.md: intent, proposals with the human's answers, paths turned down, questions |
| `kotta plan [options] <change>` | Measure a change's model delta against the accepted model and write its planning.md: structure, conflicts, silences, drift, provenance |
| `kotta approve [options] <change>` | Record the human's yes to a planned change's model delta: the one gate, written as approval.yaml |
| `kotta archive [options] <change>` | Land an approved change: merge its model into the specification, regenerate the narrative, move it to the archive |
| `kotta import openspec [options]` | Draft an OpenSpec project's requirements, scenarios and purposes into a change's model, for the planning phase to complete |

- `spec new <form>`: A form id the workspace registry declares.
- `spec new --title <title>` (required): What the node is called wherever a human reads it.
- `spec new --into <change>`: Draft the node into a change's model delta
  (`openspec/changes/<change>/model/`) instead of the accepted specification.
- `narrative --from <path>` (required): A Claude Code or Codex session log (.jsonl), or a directory
  of them.
- `narrative --since <time>`: Only messages at or after this ISO 8601 time.
- `plan` always writes `planning.md`, and exits 1 while the delta's structure, the merged view or an
  open decision blocks.
- `approve --by <who>` (required): The human who said yes in the conversation.
- `import openspec --change <name>`: The change to open under openspec/changes/; omitted is
  `import-openspec-<date>`.

See [The planning phase](planning-phase.md), [The distilled conversation](narrative.md) and
[Kotta and OpenSpec](openspec.md).

## Serve

| Command | Description |
| --- | --- |
| `kotta ui [options]` | Serve the local read-only board of the specification |
| `kotta mcp [options]` | Serve Kotta's read-only specification tools to the calling chat over stdio MCP |

- `ui --workspace <path>`: Repository root or workspace directory (default: ".").
- `ui --port <port>`: Local port; omitted starts at 4311 and advances to the next free port.
- `ui --host <host>`: Bind host (default: "127.0.0.1").
- `ui --no-open`: Print the URL without opening it in the default browser. `--json` never opens one
  either.
- `mcp --workspace <path>`: Repository root or linked worktree (default: ".").

See [The board](board.md) and [Agents and skills](agents.md).

## Also

`kotta --version` (`-V`) prints the version; `kotta help [command]` and `--help` (`-h`) print help.
