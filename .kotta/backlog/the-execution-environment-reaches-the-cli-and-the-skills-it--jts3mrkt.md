---
id: T-01kzeaez2gx5e2fme7jts3mrkt
title: The execution environment reaches the CLI and the skills it ships
status: backlog
origin: human
types:
  - bug
profiles:
  - bug
priority: medium
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

An agent launched by `kotta contract execute` can reach the `kotta` binary from its own subshells,
and is told in its brief that the lifecycle skills exist and carry the procedure. The discipline
Kotta ships stops being optional in practice.

## Actual behaviour

Two independent gaps, both measured on the oneanda workspace over 2026-07-31 / 08-01, with every
approval gate enabled in `config.yaml`.

**The binary is not reliably on PATH where the agent works.** `spawnAgent` at
`src/commands/execute.ts:68` calls `spawn(invocation.command, invocation.args, { cwd, stdio })` with
no `env` argument, so the child inherits whatever PATH the launching process happened to have.
Nothing guarantees the directory containing the running `kotta` binary is on it, and nothing
re-establishes it for the shells the agent itself spawns. Measured consequence: **12 occurrences of
`command not found: a-team`**. The operator worked around it by pasting an absolute path into a
prompt (`/Users/rp/.nvm/versions/node/v24.14.1/bin/a-team`); agents worked around it with
`export PATH=...` prefixes.

**The brief never mentions the skills.** `briefContract` at `src/commands/contract.ts:415` assembles
exactly these parts (`:467`–`:474`): header, contract body, referenced decisions, missing-decision
notice, profile blocks, claim. The word "skill" does not occur in the file. The brief's own header
states it is "the complete intent context for executing this contract (D-009)" — so an agent that
reads it as complete has no reason to look for `execute-contract`, `submit-review` or
`close-contract`. Measured consequence: **831 commands touching the CLI against 5 Skill
invocations**, with the lifecycle run as bare CLI (`ticket define` 47×, `ticket validate` 48×,
`ticket close` 21×, `ticket start` 20×) and **22 `--help` invocations** as the agent groped for the
command surface mid-task.

The second gap is the expensive one: `execute-contract`, `submit-review` and `close-contract` are
where the evidence discipline lives. When agents reach for the raw CLI instead, the commands
succeed and the discipline is simply absent.

## Expected behaviour

- The agent process, and shells it spawns, can invoke `kotta` by name without the operator supplying
  a path and without a shell-profile side effect.
- The brief names the lifecycle skills available for this contract's phase and states that they
  carry the procedure, without inlining their content and without widening the brief into other
  contracts' context.
- Neither change alters what any command does, what the brief's existing sections contain, or how
  approval works.

## Reproduction steps

PATH:

1. From a shell where `kotta` resolves only through a version-manager shim, run
   `kotta contract execute <id> --agent <agent>`.
2. In the launched agent, run a command in a fresh subshell that invokes `kotta`.
3. Observe `command not found` where the launching shell resolved the binary.

Brief:

1. `kotta contract brief <id>` for any defined contract.
2. Search the output for `skill`. There are no matches.
3. Confirm against source: `grep -c skill src/commands/contract.ts` returns 0.

## Environment

Node 20+, macOS and Linux. Reproduced with the `codex` agent; the mechanism is agent-independent
because it is in the launcher and the brief builder, not in any agent adapter. Version-manager
installs (nvm, asdf, volta) make the PATH case more likely but are not required for it.

## Frequency

PATH: every run whose agent spawns a shell that does not inherit the launcher's resolved PATH — 12
observed occurrences in two days of real use.

Brief: **every execution, without exception.** The brief has never contained a skills section.

## Impact

The quality of a Kotta run depends on which agent happens to be driving, which is exactly the
variance the system exists to remove. Two closed-ticket defects already recorded in this workspace —
evidence satisfied by volume rather than fitness, and the "Deviations: None." pattern — are
plausibly downstream of the skills never running, because those are the skills that would have
refused.

For a system whose pitch is that the procedure is enforced, "the procedure it ships is optional in
practice" is the failure that matters most on first contact.

## Regression-test expectation

- A unit test asserts `spawnAgent` passes an `env` whose `PATH` contains the directory of the
  running `kotta` binary, and that no other inherited variable is dropped.
- A unit test asserts the output of `briefContract` contains a skills section naming the lifecycle
  skills, and a second asserts the brief's other sections are byte-identical to before for a fixture
  contract.
- Both tests fail against the current implementation.

## Scope

1. Pass an explicit `env` in `spawnAgent` (`src/commands/execute.ts:68`) that inherits
   `process.env` and prepends the directory of the currently running `kotta` executable to `PATH`,
   de-duplicated, without dropping or reordering anything else.
2. Add a skills section to the brief assembled in `briefContract`
   (`src/commands/contract.ts:467`–`:474`): the names of the lifecycle skills relevant to executing
   and submitting a contract, one line each on what they cover, and a sentence stating that they
   carry the procedure and should be preferred over raw CLI calls. Names and one-line summaries
   only — no skill bodies.
3. State in the brief header that the skills section is part of the complete context, so the D-009
   completeness claim and the skills section do not contradict each other.
4. Add the regression tests above.

## Non-goals

- Changing any skill's content.
- Changing how the CLI is installed, published, or linked; no change to `package.json` `bin`.
- Any change to `src/cli/index.ts`, the command table, or the MCP tool list. That surface belongs to
  `T-01kzda6nj9hd2z45tt06fw8n0g` and must not be touched here.
- Adding hosts to `integrate`, or any new chat path.
- Enforcing skill use, or failing a run that used the raw CLI. The brief informs; it does not gate.
- Changing the brief's existing sections, their order, or the token-warning threshold.

## Acceptance

- `spawnAgent` passes an explicit `env`; the directory of the running `kotta` binary is present in
  its `PATH`, and every variable present in `process.env` is still present with its original value.
- A contract brief contains a section naming the lifecycle skills, and that section is present for
  every contract regardless of profile.
- The brief's header, contract, decision, profile and claim sections are unchanged for a fixture
  contract, verified by comparison against a pre-change capture.
- The two regression tests exist and fail when their fix is reverted.
- No file under `src/cli/` and no file under `skills/` is modified.
- `kotta validate`, `npm run typecheck` and the full suite pass.

## Verification

- `npx vitest run` on the new launcher-env and brief-skills tests.
- `npx vitest run tests/integration/` unchanged.
- `npm run typecheck`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite, excluding linked worktrees.
- Manual: `kotta contract brief <id>` and confirm the skills section reads correctly and the rest of
  the brief is unchanged against a capture taken before the change.
- Manual: launch an agent via `contract execute` and confirm `kotta --version` resolves inside a
  subshell it spawns.

## Constraints

- `.kotta/` remains canonical; this contract changes no state, no schema and no lifecycle rule.
- The PATH change must be additive. Replacing or filtering the inherited environment is out of
  bounds — an agent that loses an unrelated variable is a worse failure than the one being fixed.
- The brief must stay bounded. Adding skill names is in scope precisely because it is a few lines;
  inlining skill content would re-create the context-widening D-009 exists to prevent.
- Do not touch `src/cli/index.ts`. `T-01kzda6nj9hd2z45tt06fw8n0g` rewrites that file's command table
  and pins it with surface snapshots; an edit here would collide with it.

## Open decisions

None.

## Execution notes

- The two gaps are filed as one contract because they have one outcome — the shipped procedure
  actually reaching the agent — and because splitting them would produce two branches touching
  `src/commands/` in the same week for no verification benefit. If the PATH fix turns out to need
  platform-specific handling, split it out rather than widening this contract.
- The skills section deliberately lists names and one-liners rather than resolving which skills are
  installed. Detecting installation would couple the brief to the host's filesystem, and D-009's
  point is that the brief is derived from the workspace, not from the coordinator's environment. A
  named skill that is not installed is a no-op for the agent; the AGENTS.md contract already says
  the CLI is the whole contract when skills are absent.
- The PATH fix uses the directory of the *running* binary rather than a configured path, so a
  workspace using a linked or version-managed install gets the same binary the operator invoked.
  This is the property the 12 observed failures all violated.
- Evidence for both gaps predates this contract and lives in the resolved observation covering CLI
  reachability and skill bypass. This contract implements the two mechanical halves of it; the
  remaining half — exposing more operations to chat — belongs to
  `T-01kzda6nj9hd2z45tt06fw8n0g` and is explicitly out of scope here.
