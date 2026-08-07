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

The files a host needs to reach Kotta are **generated repository state**: written into the repo,
committed like any other file, and therefore present in every clone and every linked worktree
without per-machine setup. `kotta init` produces them, `kotta sync` regenerates them, and Kotta says
so when they no longer match what it would generate.

## Actual behaviour

**Nothing installs the skills. Not for agents, and not for the operator.** Kotta ships ten skills
under `skills/`. `src/commands/integrate.ts` is 31 lines and the string `skill` occurs in it **zero
times**; it writes `.codex/config.toml` and nothing else. No other command installs them.

The only installation that ever existed on the primary operator's machine was two hand-made
symlinks, and **both are dangling**:

```
~/.claude/skills/explore-workspace -> ../../.agents/skills/explore-workspace   (target absent)
~/.claude/skills/submit-review     -> ../../.agents/skills/submit-review       (target absent)
```

The other eight are installed nowhere. This is the mechanism behind the measured **831 commands
touching the CLI against 5 Skill invocations** on the oneanda workspace: agents did not bypass the
skills, the skills were not present. `AGENTS.md` tells agents to prefer the skills "if they are
installed"; that condition has never been true, in any session, for any host.

**The `claude` host loses its MCP tools in a worktree; `codex` does not.** The same wiring is stored
in structurally different places:

| host | where the wiring lives | survives a worktree |
|---|---|---|
| codex | `.codex/config.toml`, repo-relative, **tracked in git** | yes — verified present in `.worktrees/T-01kzdhtqw01nbgdg5dd9cw3zpr` |
| claude | `~/.claude.json`, under the key `/Users/rp/Dev/progos/kotta` | no — the agent's cwd is the worktree path, which has no entry |

`kotta contract execute` launches `claude` with `AGENT_ARGUMENTS.claude = ["-p"]` and
`cwd = <worktree>` (`src/commands/execute.ts:17`, `:68`). A Claude Code session opened in this
repository on 2026-08-07 consequently started with zero Kotta tools.

The working pattern already exists next door: `oneanda/.mcp.json` is project-scoped, tracked in git,
and needs no per-machine setup.

## Expected behaviour

- Three generated artefacts live in the repository root and are committed: `.mcp.json` registering
  the Kotta MCP server for Claude Code, `.codex/config.toml` as today, and the shipped skills under
  `.claude/skills/`.
- `kotta init` writes them while initializing a workspace, so one command produces a usable project.
- `kotta sync` regenerates them, and is the command a clone or an out-of-date repository runs.
- Each generated artefact records a content hash of what produced it. `kotta status` and
  `kotta validate` report when what is on disk no longer matches what this Kotta would generate —
  whether because Kotta was upgraded or because a file was hand-edited.
- No command writes outside the repository. The operator's global configuration is untouched.

## Reproduction steps

Skills:

1. `grep -c skill src/commands/integrate.ts` — returns 0.
2. `ls ~/.claude/skills | grep -E 'define-contract|close-contract|execute-contract'` — no results.
3. `ls -L ~/.claude/skills/submit-review` — does not resolve.

MCP in a worktree:

1. Confirm `.codex/config.toml` exists in a linked worktree under `.worktrees/`.
2. Confirm `~/.claude.json` has an `mcpServers` entry for the repository root and none for the
   worktree path.
3. Open a Claude Code session with the worktree as cwd; no `mcp__kotta__*` tool is available.

## Environment

Any Kotta checkout. Hosts: Claude Code and Codex. Not platform-specific — both gaps are properties
of where configuration is written.

## Frequency

Skills: **always.** They have never been installed by any command, on any host.

MCP: every `claude` run launched into a worktree, and every Claude Code session opened in one.

## Impact

The three skills carrying the evidence discipline — `execute-contract`, `submit-review`,
`close-contract` — have never run. Two defects already recorded in this workspace, evidence
satisfied by volume rather than fitness and the "Deviations: None." pattern, are plausibly
downstream: those skills are what would have refused.

For a tool whose claim is that the procedure is enforced, "the procedure it ships was never
installed" is the failure that matters most, and it is invisible from inside a session that never
knew the skills existed.

## Regression-test expectation

- A test asserts `init` in a temporary repository produces `.mcp.json` with a `kotta` server entry,
  `.codex/config.toml`, and the ten skills under `.claude/skills/`.
- A test asserts `sync` is idempotent: a second run changes no bytes and reports no change.
- A test asserts `status` and `validate` report drift after a generated file is edited, and after a
  recorded hash is changed to simulate an upgrade.
- A test asserts neither command writes outside the repository root.
- All fail against the current implementation.

## Scope

1. Establish the authored/generated line explicitly: `.kotta/` content is authored and is never
   overwritten; `.mcp.json`, `.codex/config.toml` and `.claude/skills/` are generated from the
   installed Kotta and are always regenerable. State it where a reader will meet it — in the
   generated files themselves and in the README.
2. Extend `src/commands/integrate.ts` from a codex-only writer into a generator that writes all
   three artefacts, unconditionally rather than by host detection. An unused config file is inert;
   detection would add a failure mode for no benefit.
3. Record a content hash in each generated artefact, covering what this Kotta would produce.
4. Rename the command `integrate` to `sync` — argument, description and help text — and update
   `README.md` and `AGENTS.md`. **No deprecated alias**; see Execution notes.
5. Call the generator from `initCommand` (`src/commands/init.ts`) after `initializeWorkspace`
   succeeds.
6. Report drift in `kotta status` and `kotta validate`: name each artefact whose on-disk hash
   differs from what this Kotta would generate, and name `kotta sync` as the remedy. Report only;
   never regenerate as a side effect.
7. Add the regression tests above, and confirm nothing newly written is caught by `.gitignore`.

## Non-goals

- **Checking npm for a newer published Kotta.** That needs a network call, and a silent request on
  an ordinary command contradicts the deterministic, repository-native character of the tool. A
  separate decision with a different risk profile; nothing today is blocked on it.
- The `claude -p` permission behaviour. `AGENT_ARGUMENTS.claude = ["-p"]` cannot write files while
  reporting success; a separate recorded defect, untouched here.
- Any PATH handling. The 12 `command not found` occurrences observed on the oneanda workspace have
  no established mechanism — a child process inherits PATH — and this contract does not guess at one.
- Any change to `src/cli/index.ts` beyond the `integrate` → `sync` command entry. The command table
  belongs to `T-01kzda6nj9hd2z45tt06fw8n0g`.
- Any change to skill content, or to which skills exist.
- Hosts beyond Claude Code and Codex.
- Removing the `~/.claude.json` entry present on the operator's machine. The new file makes it
  redundant; deleting user state is out of bounds.
- Auto-regenerating on drift. Kotta reports; the human runs the command.

## Acceptance

- `kotta init` in a fresh repository produces `.kotta/`, `.mcp.json`, `.codex/config.toml`, and ten
  skills under `.claude/skills/`.
- `kotta sync` in an already-initialized repository produces the same three artefacts; a second run
  changes no bytes and reports no change.
- Each generated artefact carries a content hash, and no authored file under `.kotta/` is written by
  either command.
- After hand-editing a generated skill, `kotta status` and `kotta validate` both name that artefact
  as drifted and name `kotta sync` as the remedy. Neither regenerates it.
- A Claude Code session opened with a linked worktree as its working directory has the Kotta MCP
  tools available, verified manually against a live worktree.
- Every file under `.claude/skills/` is readable; none is a dangling link.
- `.codex/config.toml` after the change is byte-identical to the file committed today.
- `kotta integrate` no longer exists; `kotta sync` does. `README.md` and `AGENTS.md` say so.
- No file outside the repository root is created or modified by either command.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on the new init-generation, sync-idempotency, drift-reporting and
  no-writes-outside-root tests.
- `npx vitest run tests/integration/` unchanged.
- `npm run typecheck` and `npm run build`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- Manual: run `kotta sync` in this repository, then open a Claude Code session in
  `.worktrees/<a live contract>` and confirm the `mcp__kotta__*` tools are present and a Kotta skill
  is listed.
- Manual: edit one generated skill by hand, run `kotta status`, and confirm it is named as drifted.
- Manual: `diff` the produced `.codex/config.toml` against the committed one — no difference.

## Constraints

- Repository-relative only. Writing to `~/.claude.json`, `~/.claude/skills/` or any path outside the
  repository is out of bounds; that asymmetry is the defect being fixed.
- The authored/generated line is binding. A generated artefact may be deleted and rebuilt at any
  time; an authored one is never overwritten. No command may blur this.
- Idempotent and additive. These commands run against repositories already containing configuration
  for other tools; destroying it would be far worse than the defect being fixed.
- `init` keeps refusing an already-initialized workspace. Generation is added to `init`, not a
  relaxation of its precondition.
- The change to `src/cli/index.ts` is limited to the one command entry, so the merge with
  `T-01kzda6nj9hd2z45tt06fw8n0g` stays trivial regardless of which lands first.

## Open decisions

None.

## Execution notes

- **The command is renamed, not aliased.** An `integrate` alias kept "for compatibility" would be a
  deliberate leftover with no removal date — the exact pattern this workspace already carries three
  times (`.a-team`, `migration.json`, and `session.atomics` next door), and the one the
  `consolidate-model` skill exists to catch. Kotta is pre-1.0 with one operator; a clean rename
  costs a `README` line and creates no residue.
- **A content hash, not a version number.** A version marker catches an upgrade but not a hand-edit,
  and generated files that sit in a repository will be edited. The hash catches both at the same
  cost. The rule it enforces is the one `oneanda/libs/curriculum/README.md` already states for its
  own generated read model: never edited, always deletable and regenerable.
- **Vendored, not symlinked.** The operator's decision, 2026-08-07, on the evidence: the only skills
  ever installed on this machine were symlinks, and both are dangling. A vendored copy survives a
  clone, a worktree and a dependency reinstall. The cost — a consuming repository carrying Kotta's
  skill files in its own history — is accepted, and the hash makes staleness visible rather than
  silent.
- **Why `sync` and not `integrate`.** Once every artefact is repository-relative and committed, a
  clone and a worktree get them from git and need no integration step at all. The only remaining
  reason to run the command is that the installed Kotta changed. That is regeneration, not
  integration, and the name should say so. The word is the operator's.
- The title of this contract predates its current scope. PATH handling was investigated on
  2026-08-07 and removed for lack of an established mechanism; a brief-based skills listing was
  rejected as re-inventing skill handling the host already provides. The title cannot be corrected
  because `define` does not accept a title change — an already recorded Kotta gap, hit here in the
  course of this work.
- This contract is larger than it looks and may want splitting during execution. The drift reporting
  is separable in principle, but shipping generation without it would leave stale vendored files
  failing silently, which is the defect this contract exists to prevent.
