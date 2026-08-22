---
id: F-01kzdebgbn97ve9bby1me3jkh4
title: >-
  The claude agent is invoked without a permission flag, so every claude run is
  a silent no-op recorded as implemented
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-existing
resolved_at: '2026-08-07T07:33:53.187Z'
---
# F-01kzdebgbn97ve9bby1me3jkh4 — The claude agent is invoked without a permission flag, so every claude run is a silent no-op recorded as implemented

## Observation

The claude agent is invoked without a permission flag, so every claude run is a silent no-op recorded as implemented.

## Evidence

src/commands/execute.ts sets AGENT_ARGUMENTS.claude = ['-p'], so the executor runs 'claude -p' with the brief on stdin. Claude Code in -p mode has no write permission by default: tool use requiring approval is denied and the model answers in text instead. Probed twice in an empty directory with the prompt 'Create a file named proof.txt containing OK, then reply done'. With 'claude -p' the process printed 'done', exited 0, and created nothing. With 'claude -p --permission-mode acceptEdits' it printed 'done' and created proof.txt. Observed end to end on T-01kzda6d8qr4yxqcb41yd5vn20, executed 2026-08-07 with --agent claude: the worktree HEAD stayed at its baseline e8ca058 with zero commits and zero uncommitted changes, while Kotta reported 'implemented' and appended 'Executor claude completed its implementation run.' This compounds two other observations: the implemented state never checks for change (rq792eky), and the discarded stdout (e3z74k41) removed the only record of the agent falsely claiming success. codex is unaffected because AGENT_ARGUMENTS.codex = ['exec','-'] needs no permission opt-in; both earlier contracts ran on codex, which is why this stayed hidden. Note --agent accepts a path, and an unknown agent name gets no arguments at all, so a wrapper is a workaround but not the fix.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
