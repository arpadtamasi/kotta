---
id: T-01m0v2d804h1pk95y4bmq7fk8m
title: The brief names the command for recording an out-of-scope observation
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0r52vex4j22266nepm5yq8s
  - BR-01m0fp2hdkqz08arp5ebt122r9
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-24'
updated_at: '2026-08-26'
coverage:
  'The brief''s fixed header names the observation command, so the boundary rule states both what to do and how.':
    - BR-01m0r52vex4j22266nepm5yq8s
    - BR-01m0fp2hdkqz08arp5ebt122r9
  'The brief stays deterministic: two runs on the same workspace produce identical bytes.':
    - BR-01m0r52vex4j22266nepm5yq8s
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 6a3d0209261e5f281a075343fc3872d127ee1062
resolution: completed
approved_by: cli
approved_at: '2026-08-26T09:01:24.009Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

The execution brief tells the agent the exact command for a problem it notices outside its scope. Today the fixed header says "record it, do not silently widen the context" — the rule, without the means. An agent that has never read the skills, or runs on a host where they are not installed, is told to do something and not told how. The `- kotta:` line already proves which binary to call; this names the one call the boundary rule depends on.

## Scope

One sentence in the brief's fixed header, naming `kotta observation new --title "…" --type <type> --evidence "…"`.

## Non-goals

- Any other rule in the header. The boundary sentence and the exclusion list stay as they are.
- Teaching the brief the whole CLI. One command, the one the boundary rule already implies.

## Acceptance

- The brief's fixed header names the observation command, so the boundary rule states both what to do and how.
- The brief stays deterministic: two runs on the same workspace produce identical bytes.

## Verification

- Run the brief integration tests.

## Constraints

The header is fixed text the CLI owns, not task content; it must not count toward the brief's largest-section measurement.

## Open decisions

None.

## Execution notes

The header is assembled in `briefTask` in `src/commands/task.ts`; the boundary sentence is the paragraph beginning "This brief is the complete intent context". `tests/integration/brief-reachability.test.ts` covers the `- kotta:` line and is where this belongs.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| The brief's fixed header names the observation command, so the boundary rule states both what to do and how. | run: npx vitest run tests/integration/brief-reachability.test.ts -t 'names the call it depends on' — verified: exit 0 at 91b3044 |
| The brief stays deterministic: two runs on the same workspace produce identical bytes. | run: npx vitest run tests/integration/brief-reachability.test.ts tests/integration/task-execute.test.ts -t 'brief' — verified: exit 0 at 91b3044 |

### Verification performed

The brief's fixed header names the observation command, so the boundary rule states both what to do and how.: run: npx vitest run tests/integration/brief-reachability.test.ts -t 'names the call it depends on'
The brief stays deterministic: two runs on the same workspace produce identical bytes.: run: npx vitest run tests/integration/brief-reachability.test.ts tests/integration/task-execute.test.ts -t 'brief'

### Deviations

One change beyond the stated Scope, which the task's own Constraints required: the fixed header no longer counts toward largestSection. The constraint said it must not, and it did — adding two lines made a nonsensical warning ('split the header') marginally likelier. Its size stays visible in sections; only the number that carries advice excludes it.

### Observations created

Not declared.

### Known concerns

Not declared.
