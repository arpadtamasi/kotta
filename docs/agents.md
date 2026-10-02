# Agents and skills

What Kotta tells the agents in a project, and what it installs for them: the rules file, the skills,
and the read-only tools over MCP.

## The rules file

`kotta init` writes `.kotta/AGENTS.md` from Kotta's template, with the install line rendered from the
package actually running, and points the project's own `AGENTS.md` at it with `@.kotta/AGENTS.md`
(creating one when there is none). The project's `AGENTS.md` stays the project's: Kotta appends the
pointer to an existing one only with `--link-agents`. `kotta sync` refreshes the rules file after an
upgrade; a hand-edited copy is reported as drifted and left alone until `kotta sync --replace-rules`.

Claude Code reads `CLAUDE.md`, not `AGENTS.md`, so on that host the rules would be installed and
never read. `init` and `sync` therefore also create the project's `CLAUDE.md` when there is none,
including `AGENTS.md` with the line `@AGENTS.md`. An existing `CLAUDE.md` that includes neither
`AGENTS.md` nor `.kotta/AGENTS.md` is reported and left alone; `--link-agents` appends the line.

What it tells every agent:

- **The four layers**, and that the technical model is the accepted truth: when a proposal, the
  conversation and the nodes disagree, the nodes win and the agent says where they disagree.
- **Every request to specify, propose or plan starts as a change**, opened with `kotta change new
  <name>` under `.kotta/changes/<name>/` — never a free-standing `SPEC.md`, never an OpenSpec change,
  never a new `openspec/` folder. OpenSpec is optional (`narrative:` in `.kotta/config.yaml`, `none`
  by default), and only with an OpenSpec narrative does an obligation carry SHALL or MUST.
- **`.kotta/spec/` is project-owned.** Nodes are shaped in conversation, with the workshop skills or
  by hand; a node becomes the agreement when it lands on the base branch on a human yes. There is no
  process layer, and `legacy/` is never written.
- **Orient first** with `kotta validate`, `kotta gap` and `kotta questions`, and read
  `.kotta/config.yaml` rather than assuming defaults.
- **Identifiers are minted, never typed** (`kotta spec new`), and a node is named by its title
  wherever a human reads.
- **Evidence names its node**: cite the id where the code keeps a promise and in the test that proves
  it, or admit the gap with its kind.

And seven rules:

1. The technical model is the accepted truth; propose changes to nodes, never decide them, and mark
   your own contradiction findings `judged`. Between a change's approval and its archive, the
   approved delta is the agreement for the nodes it touches.
2. Never invent product intent: where a form asks for something nobody said, write the question.
3. Stay inside the change; say anything outside it to the human in one line.
4. Approval is a human gate, asked in the conversation, by title, for a plain yes or no. Anything
   less than an explicit yes is a no. One gate per change, at the end of planning; after the yes
   the agent offers the work, not the archive, and the change stays open until it is built.
5. Evidence names its node. An unbuilt node of an approved open change needs no admission; what is
   still unkept at the archive is admitted, or `kotta archive` refuses it.
6. Never write into `legacy/`.
7. Say when the code runs ahead of the spec: implement as asked; when the code keeps, changes or
   drops a promise that neither the model nor an approved open change states, say so in one line
   and offer `plan-change`, without stopping. Building an approved change, or work that touches no
   promise, needs no word about the spec.

## The skills

`kotta init` and `kotta sync` copy the shipped skills into `~/.claude/skills/` (or
`$KOTTA_SKILLS_HOME`), record which ones Kotta owns in `.kotta-installed.json`, never overwrite a
skill of the same name that Kotta does not own, and remove owned skills a release no longer ships.

| Skill | Use it to |
| --- | --- |
| `plan-change` | open a change and carry it from its proposal to the one gate: distil, translate with provenance, `kotta plan`, ask, record the yes |
| `setup-kotta` | initialize a workspace, or migrate a pre-1.0 one |
| `explore-workspace` | answer questions across the specification and its legacy archive: what touches this, what is open, what has no evidence |
| `requirements-traceability` | read the model as a graph: dangling edges, coverage, the impact of changing a node |
| `consolidate-model` | find one concept living under several names across code, docs, schemas and storage, and propose consolidations |
| `report-kotta-bug` | report a defect in Kotta itself as a GitHub issue, after showing you the exact text |

The specification workshops draft nodes with you, in conversation, into the change you are working
in (`kotta spec new <form> --title "…" --into <change>`), never straight into `.kotta/spec/`:

| Skill | Drafts |
| --- | --- |
| `impact-mapping` | goals and actors, and how features serve an outcome |
| `story-mapping` | user stories, sliced along a journey |
| `use-case-modeling` | use cases with their main success scenario and alternatives |
| `example-mapping` | business rules and the examples that prove them |
| `event-storming` | entities and state machines from domain events |
| `ubiquitous-language` | glossary terms, with their non-examples |
| `quality-scenarios` | measurable quality attributes |
| `design-by-task` | interfaces: preconditions, postconditions, invariants, failures |

## The tools over MCP

`kotta mcp` serves five read-only tools to the calling chat over stdio:

| Tool | Returns |
| --- | --- |
| `spec_list` | every accepted node with its id, form, title and path, optionally narrowed to one form |
| `spec_show` | one node as stored: frontmatter, sections and path; accepts the short id |
| `workspace_validate` | every node measured against its form, as structured violations |
| `workspace_questions` | the open decisions of one node or of every node, each with its position |
| `gap_report` | the `kotta gap` report of the base branch |

None of them writes. The chat drafts in conversation, and a change lands through `plan`, the human's
yes and `archive`.

`kotta integrate codex` records the server in the project's `.codex/config.toml`, with the
interpreter and entry point that are running, so a host that spawns Kotta from a non-interactive
shell finds it:

```toml
[mcp_servers.kotta]
command = "/path/to/node"
args = ["/path/to/kotta/dist/cli/index.js", "mcp", "--workspace", "."]
enabled = true
required = false
startup_timeout_sec = 10
tool_timeout_sec = 120
default_tools_approval_mode = "auto"
```

An existing block is never rewritten; if the command it names is gone, `integrate` says so and names
the replacement. `kotta doctor` reports how Kotta is running and whether the bare name `kotta`
resolves on the current `PATH`.
