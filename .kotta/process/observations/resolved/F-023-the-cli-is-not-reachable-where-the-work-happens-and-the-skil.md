---
id: F-023
title: >-
  The CLI is not reachable where the work happens, and the skills are bypassed —
  831 a-team commands, 5 skill invocations
status: resolved
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-01'
disposition: create-contract
resolved_at: '2026-08-02T02:49:16.110Z'
contract: T-028
---
# F-023 — The CLI is not reachable where the work happens, and the skills are bypassed — 831 a-team commands, 5 skill invocations

## Observation

Two frictions that compound. The binary is often not on PATH in the very places A-Team sends agents to work — worktrees and subshells. And the lifecycle skills, which carry the actual procedure, are almost never invoked; agents drive the raw CLI instead, so the procedure never runs.

## Evidence

oneanda transcripts, 2026-07-31 / 08-01:

- **12 occurrences** of `command not found: a-team`.
- The operator had to paste the absolute path into a prompt to make a run work: `CLI: /Users/rp/.nvm/versions/node/v24.14.1/bin/a-team`. Agents also worked around it with `export PATH="/opt/homebrew/bin:$PATH"` prefixes.
- **22 `--help` invocations** (`ticket --help` 9, `package --help` 6, `finding --help` 4, `decision --help` 3) — the agent groping for the command surface mid-task.
- **831** commands touching a-team versus **5** Skill invocations (one `execute-package`, one `define-ticket`, plus unrelated). The ticket lifecycle ran as bare CLI: `ticket define` 47×, `ticket validate` 48×, `ticket close` 21×, `ticket start` 20×.
- Two malformed invocations in the transcript (`a-team validate erre`, `a-team szerkesztes tilos`) — prose leaking into the command line.

The second point is the expensive one. `execute-ticket`, `submit-review` and `close-ticket` are where the evidence discipline lives. If agents reach for the CLI instead, the commands succeed and the discipline is simply absent — which is a plausible mechanism behind [[F-018]] and [[F-019]].

## Impact hypothesis

The procedure A-Team ships is optional in practice. Quality then depends on whichever agent happens to be driving, which is exactly the variance the system exists to remove.

## Confidence

High: counted from the transcripts.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Two independent slices: (1) guarantee the binary resolves inside worktrees the tool itself creates; (2) work out why an agent picks `a-team ticket close` over `close-ticket` — if the CLI is the path of least resistance, the discipline must live in the CLI, not only in the skill.
