---
id: T-01m0qz128k7h6vtnhnykj5sba8
title: The invocation Kotta writes for a host does not depend on PATH
status: done
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0qyxvz954ay2rbm00bazrd5
  - EX-01m0qyxvz926gdbvzm4bfxzn2w
  - IF-01m0f0wn8994dzf9z1sdygxa04
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-23'
updated_at: '2026-08-23'
coverage:
  'The written invocation resolves without a PATH. `kotta integrate` records the interpreter running Kotta and the absolute path of Kotta''s own entry point, and a host spawning that invocation with an empty PATH starts the MCP server.':
    - BR-01m0qyxvz954ay2rbm00bazrd5
    - EX-01m0qyxvz926gdbvzm4bfxzn2w
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'A stale recorded invocation is named, not passed over. Running integrate against a configuration whose recorded command no longer exists reports that command by name instead of reporting the host as already configured.':
    - BR-01m0qyxvz954ay2rbm00bazrd5
    - EX-01m0qyxvz926gdbvzm4bfxzn2w
  'A recorded invocation that still resolves is left alone, and integrate says it is already configured without rewriting the file.':
    - BR-01m0qyxvz954ay2rbm00bazrd5
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'Nothing else Kotta prints changes. The prose that tells a human to run `kotta task close <id>` keeps the bare name, because that is what a person types.':
    - BR-01m0qyxvz954ay2rbm00bazrd5
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: a384bae6713f1597873d6f199d4d9ff3a026925e
resolution: completed
approved_by: cli
approved_at: '2026-08-23T19:17:55.733Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

The configuration `kotta integrate` writes starts Kotta in the environment a host actually spawns it from. Today it writes `command = "kotta"` (`src/commands/integrate.ts:6`) — a name resolved against a PATH Kotta cannot see. That fails in exactly the environments Kotta sends work into: a non-interactive shell loads no version manager, so the binary installed through one is absent. It fails in this repository's own session, where `which kotta` finds nothing while Kotta is running, and it was measured before as twelve `command not found` failures in one project's worktrees and subshells.

## Scope

- `integrateCodex` writes an invocation proved from the running process: `process.execPath` as the command, and Kotta's own entry point — resolved from this module's URL, not from `process.argv[1]`, which may be relative — as the first argument.
- The existing-block path stops being a silent pass. It checks whether the recorded command still exists on disk and reports it by name when it does not.
- `CODEX_MCP_CONFIG` stops being a frozen string and becomes a function of the resolved invocation; its exported shape follows.

## Non-goals

- Installing Kotta, or reasoning about version managers. The invocation is refreshed by running `integrate` again, and this task adds no upgrade detection beyond reporting a command that has gone missing.
- Rewriting a configuration block a human may have edited. A stale invocation is reported, never silently replaced.
- The prose in Kotta's own messages and skills. `kotta task close <id>` is what a person types, and an absolute path there would be noise the rule explicitly excludes.
- The agent-launch path (`resolveAgentCommand`), which resolves another program's binary, not Kotta's own, and is not what this rule governs.

## Constraints

The recorded invocation must be readable by a human editing the file afterwards. An absolute node path and an absolute script path are long but legible; nothing may be encoded or escaped beyond what TOML requires.

`integrate` must stay idempotent: a second run against a configuration it wrote changes no bytes.

## Open decisions

None.

## Execution notes

`process.execPath` is the absolute path of the Node binary executing Kotta and is always set. The entry point resolves as `fileURLToPath(new URL("../cli/index.js", import.meta.url))` from `src/commands/integrate.ts`, since the built module sits in `dist/commands/` beside `dist/cli/`.

`dist/cli/index.js` carries a `#!/usr/bin/env node` shebang, so naming it as a bare command would still depend on `env` finding node — which is the same hope in a different place. Naming the interpreter explicitly is what removes the dependency.

The existing-block detection is the regex at `src/commands/integrate.ts:22`; the command it recorded is on the following `command = "…"` line.

## Acceptance

- The written invocation resolves without a PATH. `kotta integrate` records the interpreter running Kotta and the absolute path of Kotta's own entry point, and a host spawning that invocation with an empty PATH starts the MCP server.
- A stale recorded invocation is named, not passed over. Running integrate against a configuration whose recorded command no longer exists reports that command by name instead of reporting the host as already configured.
- A recorded invocation that still resolves is left alone, and integrate says it is already configured without rewriting the file.
- Nothing else Kotta prints changes. The prose that tells a human to run `kotta task close <id>` keeps the bare name, because that is what a person types.

## Verification

- `run: npx vitest run tests/integration/integrate-invocation.test.ts` — the new suite, including spawning the recorded invocation with an empty PATH and reading the MCP server's handshake.
- `run: npm test` — the full suite.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The written invocation resolves without a PATH. `kotta integrate` records the interpreter running Kotta and the absolute path of Kotta's own entry point, and a host spawning that invocation with an empty PATH starts the MCP server. | run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'the recorded invocation starts Kotta with no PATH at all' — verified: exit 0 at 42b914d |
| A stale recorded invocation is named, not passed over. Running integrate against a configuration whose recorded command no longer exists reports that command by name instead of reporting the host as already configured. | run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'a recorded command that is gone is named, not passed over' — verified: exit 0 at 42b914d |
| A recorded invocation that still resolves is left alone, and integrate says it is already configured without rewriting the file. | run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'a second run changes no bytes' — verified: exit 0 at 42b914d |
| Nothing else Kotta prints changes. The prose that tells a human to run `kotta task close <id>` keeps the bare name, because that is what a person types. | The diff at 42b914d touches src/commands/integrate.ts and one renderer in src/cli/index.ts; no message string elsewhere changed, and the surface snapshot in tests/integration/surface-snapshot.test.ts is unmoved, which the full suite proves. |

### Verification performed

The written invocation resolves without a PATH. `kotta integrate` records the interpreter running Kotta and the absolute path of Kotta's own entry point, and a host spawning that invocation with an empty PATH starts the MCP server.: run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'the recorded invocation starts Kotta with no PATH at all'
A stale recorded invocation is named, not passed over. Running integrate against a configuration whose recorded command no longer exists reports that command by name instead of reporting the host as already configured.: run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'a recorded command that is gone is named, not passed over'
A recorded invocation that still resolves is left alone, and integrate says it is already configured without rewriting the file.: run: npx vitest run tests/integration/integrate-invocation.test.ts -t 'a second run changes no bytes'
Nothing else Kotta prints changes. The prose that tells a human to run `kotta task close <id>` keeps the bare name, because that is what a person types.: The diff at 42b914d touches src/commands/integrate.ts and one renderer in src/cli/index.ts; no message string elsewhere changed, and the surface snapshot in tests/integration/surface-snapshot.test.ts is unmoved, which the full suite proves.

### Deviations

Not declared.

### Observations created

Not declared.

### Known concerns

Not declared.
