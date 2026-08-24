---
id: T-01m0sdzjpwx5kafvp1g5a5tek7
title: The brief tells the agent how to reach Kotta
status: active
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
  - BR-01m0r52vex4j22266nepm5yq8s
  - EX-01m0r52vexxy9azs452pb05pmr
  - IF-01m0f0wn89efd2ss83c4csk7qx
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-24'
updated_at: '2026-08-24'
coverage:
  'The brief states the invocation. Every execution brief carries one line naming the interpreter and entry point that produced it, so an agent reading only the brief knows how to reach Kotta from where it is.':
    - BR-01m0r52vex4j22266nepm5yq8s
    - EX-01m0r52vexxy9azs452pb05pmr
    - IF-01m0f0wn89efd2ss83c4csk7qx
  'The stated invocation works from a shell with no PATH. Spawning exactly what the brief names, with an empty environment, runs a Kotta command and returns its result.':
    - BR-01m0r52vex4j22266nepm5yq8s
    - EX-01m0r52vexxy9azs452pb05pmr
  'A diagnostic answers the reachability question on demand, reporting whether the bare name `kotta` resolves and naming the working invocation when it does not.':
    - BR-01m0r52vex4j22266nepm5yq8s
    - EX-01m0r52vexxy9azs452pb05pmr
  'Skills and messages are untouched. The shipped skills still read `kotta task close <id>`, and no message string gains an absolute path.':
    - BR-01m0r52vex4j22266nepm5yq8s
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: dacced88f206aa3ebd3bf4f9d381ca2af72442eb
---
## Outcome

An agent executing a task can reach the control plane every rule tells it to use. Today the brief — declared to be the complete execution context — says what to do and never how to reach Kotta, while forty-nine bare `kotta` calls wait in the shipped skills and the worktree gets no shim, no environment and no path. In a non-interactive shell without a version manager, that name resolves to nothing.

The host configuration was repaired for the same reason at 088b1c8. This is the other direction: host to server was fixed, agent to CLI was not.

## Scope

- The brief gains one stated invocation, resolved the way `kottaInvocation()` already resolves it for `integrate`, so both surfaces answer from the same fact.
- A diagnostic reports whether `kotta` resolves as a bare name from a non-interactive shell, and names the working invocation when it does not.
- The declaration in `src/core/operations.ts` gains the diagnostic, since neither surface may carry a command it does not name.

## Non-goals

- Rewriting skills or messages. The rule excludes them by name: they are read by people, and absolute paths there are permanent noise bought against one failure.
- A worktree shim or any PATH manipulation. Kotta states a fact; it does not edit the environment its agents run in.
- Installation, version managers, or the agent's own binary.

## Constraints

The brief is the agent's whole context and is already dense. One line, in the header block where the other facts sit — not a section.

`kottaInvocation()` is the single source; this task must not add a second way to answer the same question.

## Open decisions

None.

## Execution notes

`kottaInvocation()` in `src/commands/integrate.ts` returns the interpreter and the absolute entry point, proved from the running process. It should move to a neutral home — `src/core/` — now that two callers need it.

The brief is assembled in `src/commands/show.ts` and reached through `task brief`; its header is the list of `- key: value` lines above the D-009 paragraph.

The diagnostic needs no new resolution logic: it compares `kottaInvocation()` against what a bare `kotta` resolves to in a shell started without the operator's profile.

## Acceptance

- The brief states the invocation. Every execution brief carries one line naming the interpreter and entry point that produced it, so an agent reading only the brief knows how to reach Kotta from where it is.
- The stated invocation works from a shell with no PATH. Spawning exactly what the brief names, with an empty environment, runs a Kotta command and returns its result.
- A diagnostic answers the reachability question on demand, reporting whether the bare name `kotta` resolves and naming the working invocation when it does not.
- Skills and messages are untouched. The shipped skills still read `kotta task close <id>`, and no message string gains an absolute path.

## Verification

- `run: npx vitest run tests/integration/brief-reachability.test.ts` — the new suite, including spawning what the brief names with an empty environment.
- `run: npm test` — the full suite.
