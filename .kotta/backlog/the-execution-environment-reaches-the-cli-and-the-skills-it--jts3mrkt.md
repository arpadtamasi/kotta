---
id: T-01kzeaez2gx5e2fme7jts3mrkt
title: The execution environment reaches the CLI and the skills it ships
status: backlog
origin: human
types:
  - bug
profiles:
  - bug
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-07'
updated_at: '2026-08-07'
---
# T-01kzeaez2gx5e2fme7jts3mrkt — The execution environment reaches the CLI and the skills it ships

## Outcome

Host wiring is repository-relative state, written into the repo and committed like any other Kotta
file. A launched agent — and a cloned checkout, and a linked worktree — gets the Kotta MCP tools and
the Kotta skills without anyone configuring a machine by hand.

## Actual behaviour

**Nothing installs the skills. Not for agents, and not for the operator.** Kotta ships ten skills
under `skills/`. `src/commands/integrate.ts` is 31 lines and the string `skill` occurs in it **zero
times**; it writes `.codex/config.toml` and nothing else. No other command installs them either.

The only installation in existence on the primary operator's machine was two hand-made symlinks, and
**both are dangling**:

```
~/.claude/skills/explore-workspace -> ../../.agents/skills/explore-workspace   (target absent)
~/.claude/skills/submit-review     -> ../../.agents/skills/submit-review       (target absent)
```

The other eight are installed nowhere. This is the mechanism behind the measured **831 commands
touching the CLI against 5 Skill invocations** on the oneanda workspace: agents did not bypass the
skills, the skills were not present. `AGENTS.md` instructs agents to prefer the skills "if they are
installed"; that condition has never been true.

**The `claude` host loses its MCP tools in a worktree, and `codex` does not.** The two hosts store
the same wiring in structurally different places:

| host | where the wiring lives | survives a worktree |
|---|---|---|
| codex | `.codex/config.toml`, repo-relative, **tracked in git** | yes — verified present in `.worktrees/T-01kzdhtqw01nbgdg5dd9cw3zpr` |
| claude | `~/.claude.json` under the key `/Users/rp/Dev/progos/kotta` | no — the agent's cwd is the worktree path, which has no entry |

`kotta contract execute` launches `claude` with `AGENT_ARGUMENTS.claude = ["-p"]` and
`cwd = <worktree>` (`src/commands/execute.ts:17`, `:68`). A Claude Code session opened in this
repository on 2026-08-07 consequently started with zero Kotta tools, already recorded as an
observation.

The pattern that works is already in use in a neighbouring repository: `oneanda/.mcp.json` is
project-scoped, tracked in git, and needs no per-machine setup.

## Expected behaviour

- `.mcp.json` in the repository root registers the Kotta MCP server for Claude Code, tracked in git,
  requiring no entry in `~/.claude.json`.
- `.codex/config.toml` keeps doing what it already does, unchanged.
- The Kotta skills are present under `.claude/skills/` in the repository, so any Claude Code session
  opened anywhere in the checkout — including a linked worktree — can use them.
- `kotta init` performs the host wiring as part of initializing a workspace, so a fresh project is
  usable from chat without a second command.
- `kotta integrate` remains the entry point for doing the same wiring again: on a cloned repository
  whose `.kotta/` arrived through git and where `init` must not run, and after a host is added or a
  configuration is lost.
- No command writes outside the repository. The operator's global configuration is not touched.

## Reproduction steps

Skills:

1. `grep -c skill src/commands/integrate.ts` — returns 0.
2. `ls ~/.claude/skills | grep -E 'define-contract|close-contract|execute-contract'` — no results.
3. `ls -L ~/.claude/skills/submit-review` — the symlink does not resolve.

MCP in a worktree:

1. Confirm `.codex/config.toml` exists in a linked worktree under `.worktrees/`.
2. Confirm `~/.claude.json` has an `mcpServers` entry for the repository root and none for the
   worktree path.
3. Open a Claude Code session with the worktree as cwd and observe that no `mcp__kotta__*` tool is
   available.

## Environment

Any Kotta checkout. Hosts: Claude Code and Codex. Not platform-specific — both gaps are properties
of where configuration is written, not of the operating system.

## Frequency

Skills: **always.** They have never been installed by any command.

MCP: every `claude` run launched into a worktree, and every Claude Code session opened in one.

## Impact

The three skills that carry the evidence discipline — `execute-contract`, `submit-review`,
`close-contract` — have never run. Two defects already recorded in this workspace, evidence
satisfied by volume rather than fitness and the "Deviations: None." pattern, are plausibly
downstream of that: those skills are what would have refused.

For a tool whose claim is that the procedure is enforced, "the procedure it ships was never
installed" is the failure that matters most, and it is invisible from inside a session that never
knew the skills existed.

## Regression-test expectation

- A test asserts `init` produces `.mcp.json` with a `kotta` server entry, `.codex/config.toml`, and
  the skills under `.claude/skills/`, in a temporary repository.
- A test asserts `integrate` is idempotent: running it twice leaves byte-identical files and reports
  no change on the second run.
- A test asserts no command writes outside the repository root during `init` or `integrate`.
- All fail against the current implementation.

## Scope

1. Extend `src/commands/integrate.ts` from a codex-only writer into host wiring that writes, into
   the repository root: `.mcp.json` registering the Kotta MCP server for Claude Code,
   `.codex/config.toml` exactly as today, and the shipped skills under `.claude/skills/`.
2. Write all host configurations unconditionally rather than detecting the host. An unused
   configuration file is inert, and detection would add a failure mode for no benefit.
3. Make the wiring idempotent and additive: preserve any existing content it did not write, report
   what changed, and change nothing on a second run.
4. Call the wiring from `initCommand` (`src/commands/init.ts`) after `initializeWorkspace`
   succeeds.
5. Relax the host guard at `src/cli/index.ts:315` and its argument description at `:312` so
   `integrate` covers the hosts it now writes. This is the only change to that file.
6. Add the regression tests above, and a `.gitignore` review so nothing newly written is
   accidentally ignored.

## Non-goals

- The `claude -p` permission behaviour. `AGENT_ARGUMENTS.claude = ["-p"]` cannot write files while
  reporting success; that is a separate recorded defect and is not touched here.
- Any PATH handling. The 12 `command not found` occurrences observed on the oneanda workspace have
  no established mechanism — a child process inherits PATH — and this contract does not guess at one.
- Any change to `src/cli/index.ts` beyond the two lines named in Scope 5. The command table belongs
  to `T-01kzda6nj9hd2z45tt06fw8n0g`.
- Any change to skill content, to `AGENTS.md`, or to which skills exist.
- Hosts beyond Claude Code and Codex.
- Removing the `~/.claude.json` entry that exists today on the operator's machine. The new file makes
  it redundant; deleting user state is out of bounds.
- Migrating already-initialized workspaces automatically. They run `integrate`.

## Acceptance

- `kotta init` in a fresh repository produces `.kotta/`, `.mcp.json` with a `kotta` server entry,
  `.codex/config.toml`, and the ten skills under `.claude/skills/`.
- `kotta integrate` in an already-initialized repository produces the same three, and running it a
  second time changes no bytes and reports no change.
- A Claude Code session opened with a linked worktree as its working directory has the Kotta MCP
  tools available, verified manually against a live worktree.
- The skills resolve: every file under `.claude/skills/` is readable and none is a dangling link.
- `.codex/config.toml` after the change is byte-identical to the file this repository has today.
- No file outside the repository root is created or modified by either command.
- Only two lines of `src/cli/index.ts` differ.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on the new init-wiring, idempotency and no-writes-outside-root tests.
- `npx vitest run tests/integration/` unchanged.
- `npm run typecheck` and `npm run build`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- Manual: run `kotta integrate` in this repository, then open a Claude Code session in
  `.worktrees/<some-contract>` and confirm the `mcp__kotta__*` tools are present and a Kotta skill
  is listed.
- Manual: `diff` the produced `.codex/config.toml` against the committed one — no difference.

## Constraints

- Repository-relative only. Writing to `~/.claude.json`, `~/.claude/skills/` or any other path
  outside the repository is out of bounds; that asymmetry is the defect being fixed.
- Additive and idempotent. These commands run against repositories that already contain
  configuration for other tools, and destroying it would be a far worse failure than the one being
  fixed.
- `init` keeps refusing an already-initialized workspace. Wiring is added to `init`, not a
  relaxation of its precondition.
- The two-line change to `src/cli/index.ts` is a hard ceiling, so the merge with
  `T-01kzda6nj9hd2z45tt06fw8n0g` stays trivial regardless of which lands first.

## Open decisions

None.

## Execution notes

- The skills are vendored into `.claude/skills/` rather than symlinked into `node_modules`. The
  decision is the operator's, taken 2026-08-07, and the reason is the evidence: the only skills ever
  installed on this machine were symlinks, and both are dangling. A vendored copy survives a clone,
  a worktree and a dependency reinstall; a symlink survives none of them reliably. The cost is that
  a consuming repository carries Kotta's skill files in its own history, which is accepted.
- Host configurations are written unconditionally rather than detected. Detection has to decide what
  counts as "codex is present", and a wrong answer produces a silently unusable workspace — the
  exact failure mode already being fixed. An inert config file costs nothing.
- The title of this contract predates its current scope: PATH handling was investigated on
  2026-08-07 and removed for lack of an established mechanism, and the brief-based skills listing was
  rejected by the operator as re-inventing skill handling that the host already provides. The title
  cannot be corrected because `define` does not accept a title change — an already recorded Kotta
  gap, hit here in the course of this work.
- `~/.claude.json` keeps its existing entry. Once `.mcp.json` lands the entry is redundant, and
  whether to clean up per-machine state is a separate decision belonging to whoever owns that
  machine.
