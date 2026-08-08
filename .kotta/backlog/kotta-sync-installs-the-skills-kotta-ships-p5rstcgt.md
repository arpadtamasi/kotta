---
id: T-01kzgn32keps18769dp5rstcgt
title: kotta sync installs the skills Kotta ships
status: backlog
origin: human
types:
  - bug
profiles:
  - bug
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-08'
updated_at: '2026-08-08'
---
# T-01kzgn32keps18769dp5rstcgt — kotta sync installs the skills Kotta ships

## Outcome

`kotta sync` installs the skills Kotta ships, so they exist for the sessions that are told to use
them. One command, run once, covering every project and every worktree.

## Actual behaviour

Kotta ships ten skills under `skills/`. **Nothing installs them.**

`src/commands/integrate.ts` is 31 lines and the string `skill` occurs in it zero times; it writes
`.codex/config.toml` and nothing else. No other command touches them.

The only installation that ever existed on the primary operator's machine was two hand-made
symlinks, and both are dangling — their target holds unrelated skills:

```
~/.claude/skills/explore-workspace -> ../../.agents/skills/explore-workspace   (target absent)
~/.claude/skills/submit-review     -> ../../.agents/skills/submit-review       (target absent)
```

The other eight are installed nowhere.

`AGENTS.md` tells agents to prefer the skills "if they are installed". That condition has never been
true, in any session, on any host.

## Expected behaviour

- `kotta sync` copies the shipped skills into `~/.claude/skills/`, one directory each, and reports
  what it changed.
- Running it again changes nothing and says so.
- `kotta init` runs it after creating a workspace, so a new project needs one command rather than
  two.
- `kotta status` reports when an installed skill no longer matches the shipped one — because Kotta
  was upgraded, or because the copy was edited.
- Nothing is written into any repository, and nothing Kotta did not install is overwritten.

## Reproduction steps

1. `grep -c skill src/commands/integrate.ts` — returns 0.
2. `ls ~/.claude/skills | grep -E 'define-contract|close-contract|execute-contract'` — no results.
3. `ls -L ~/.claude/skills/submit-review` — does not resolve.
4. Open a chat session in this repository and look for a Kotta skill in the available list — there
   is none.

## Environment

Any machine with Kotta installed. Claude Code reads `~/.claude/skills/`; Codex does not, so this
contract improves Claude Code sessions only. The limit is stated rather than worked around.

## Frequency

Always. No command has ever installed a skill.

## Impact

Measured on the oneanda workspace, 2026-07-31 / 08-01: **831 commands touching the CLI against 5
Skill invocations**, plus 22 `--help` invocations as agents groped for the command surface mid-task.
The agents did not bypass the skills — the skills were not there.

The three that carry the evidence discipline — `execute-contract`, `submit-review`,
`close-contract` — have therefore never run. Two defects already recorded in this workspace,
evidence satisfied by volume rather than fitness and the "Deviations: None." pattern, are plausibly
downstream: those skills are what would have refused.

## Regression-test expectation

- A test asserts `sync` into a temporary home creates ten skill directories, each with a readable
  `SKILL.md`.
- A test asserts a second run changes no bytes and reports no change.
- A test asserts a dangling symlink at a target path is replaced, and a real directory Kotta did not
  install is left alone and reported as a conflict.
- A test asserts `status` reports a skill whose installed copy differs from the shipped one.
- A test asserts nothing is written inside the repository.
- All fail against the current implementation.

## Scope

1. Add `kotta sync`: copy each directory under the installed package's `skills/` into
   `~/.claude/skills/<name>/`, reporting created, updated, unchanged and skipped counts.
2. Copy, never symlink. Replace a dangling symlink at a target path. Leave any real directory Kotta
   did not install untouched, and name it as a conflict in the output.
3. Call it from `initCommand` after `initializeWorkspace` succeeds.
4. Report drift in `kotta status`: compare each installed skill against the shipped one and name
   those that differ, with `kotta sync` as the remedy. Report only; never install as a side effect.
5. Add the regression tests above.

## Non-goals

- **Any MCP wiring.** No `.mcp.json`, no change to `.codex/config.toml`, no change to `integrate`.
  Whether the MCP server is needed at all is an open product question, and nothing here depends on
  the answer.
- Renaming or removing `integrate`. It does a different job and keeps doing it.
- Codex skill support. Codex does not read `~/.claude/skills/`.
- Writing anything into a repository, including `.claude/skills/`. Global installation is what makes
  one run cover every project and every worktree.
- Changing any skill's content, or which skills exist.
- Uninstalling. Deleting user state is out of bounds.
- The `claude -p` permission behaviour, and PATH handling. Separate matters, untouched.

## Acceptance

- `kotta sync` installs ten skill directories under `~/.claude/skills/`, each with a readable
  `SKILL.md` and no dangling link.
- A second run changes no bytes and reports no change.
- The two dangling symlinks at `explore-workspace` and `submit-review` are replaced by real
  directories.
- A real directory at a target path that Kotta did not install is left untouched and reported.
- `kotta status` names any installed skill that differs from the shipped one, and does not install
  it.
- `kotta init` in a fresh repository leaves the skills installed.
- No file inside any repository is created or modified by `sync`.
- `integrate` and `.codex/config.toml` are unchanged.
- `kotta validate`, `npm run typecheck` and the full suite pass.

## Verification

- `npx vitest run` on the new sync, idempotency, conflict and drift tests, each against a temporary
  home directory rather than the real one.
- `npx vitest run tests/integration/` unchanged.
- `npm run typecheck`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- Manual: run `kotta sync`, restart a chat session in this repository, and confirm a Kotta skill
  appears in the available list.
- Manual: edit one installed skill, run `kotta status`, confirm it is named and not overwritten.

## Constraints

- Copy, not symlink. The only skills ever installed on this machine were symlinks and both broke; a
  copy survives a moved or removed source.
- Never overwrite what Kotta did not install. A name collision is reported, not resolved.
- `sync` writes only under `~/.claude/skills/`. Nothing else on the machine, nothing in a
  repository.
- Report, never repair as a side effect. `status` names drift; the human runs `sync`.

## Open decisions

None.

## Execution notes

- This replaces `T-01kzeaez2gx5e2fme7jts3mrkt`, cancelled as obsolete. That contract had grown to
  carry `.mcp.json`, per-repository vendoring, section-level ownership of shared config files and a
  rename of `integrate`. All of it was removed on the operator's instruction that the result be
  simple to use. What remains is the one thing that is measurably broken and blocks nothing else.
- Global rather than per-repository. A copy under `~/.claude/skills/` is seen by every project and
  every linked worktree, which removes the worktree path problem rather than solving it. A clone
  does not get them, which for a single-operator tool is not a cost.
- Drift detection stores nothing. The shipped skills are on disk in the installed package, so
  `status` compares the installed copy against them directly. There is no marker to keep correct.
- The two known collisions are the operator's dangling symlinks. They are replaced because they are
  broken; anything intact stays, because Kotta cannot know what put it there.
