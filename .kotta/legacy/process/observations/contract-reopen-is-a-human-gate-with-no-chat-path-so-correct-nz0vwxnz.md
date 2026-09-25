---
id: F-01kzdjbwjtqavthcxbnz0vwxnz
title: >-
  contract.reopen is a human gate with no chat path, so correcting a review
  record still requires a terminal
status: resolved
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:05.113Z'
approved_by: cli
approved_at: '2026-08-21T15:07:05.113Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kzdjbwjtqavthcxbnz0vwxnz — contract.reopen is a human gate with no chat path, so correcting a review record still requires a terminal

## Observation

contract.reopen is a human gate with no chat path, so correcting a review record still requires a terminal.

## Evidence

reopenContract at src/commands/contract.ts:354 throws 'Human approval is required to reopen terminal or reviewed work', so reopen is a human gate exactly like sign and close. The approval_request enum at src/commands/mcp.ts:209 lists only contract.sign, observation.resolve, contract.close, contract.request-changes and batch.close. reopen is absent, so it cannot be approved from the calling chat under any host, and the CLI --approve flag is the only path that exists. Hit directly on 2026-08-07: T-01kzda6d8qr4yxqcb41yd5vn20 was submitted for review with a known-concern paragraph that later proved wrong about the mechanism, and correcting the canonical .kotta/review/ record requires reopen -> active -> review again. The human therefore had to be handed a terminal command by the very workflow that T-01kz8tk2t53jbax6mrseka50v9 shipped to remove. This is the same failure mode as F-01kzd9sh03y7hwwbeen5cp4s0q: the chat surface is a hand-curated subset and nothing detects an omission. T-01kzda6nj9hd2z45tt06fw8n0g is the structural remedy; this observation is the concrete cost.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
