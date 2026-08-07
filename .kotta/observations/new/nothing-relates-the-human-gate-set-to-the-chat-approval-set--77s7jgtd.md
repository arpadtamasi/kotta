---
id: F-01kze54x7ykmsz496c77s7jgtd
title: >-
  Nothing relates the human-gate set to the chat-approval set, so batch sign
  joins reopen as a gate reachable only from a terminal
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
---
# F-01kze54x7ykmsz496c77s7jgtd — Nothing relates the human-gate set to the chat-approval set, so batch sign joins reopen as a gate reachable only from a terminal

## Observation

Nothing relates the human-gate set to the chat-approval set, so batch sign joins reopen as a gate reachable only from a terminal.

## Evidence

Kotta refuses six operations without human approval: signContract (src/commands/contract.ts:98), closeContract, reopenContract (src/commands/contract.ts:354), requestChanges, resolveObservation (src/commands/observation.ts:83), signBatch (src/commands/batch.ts:155) and closeBatch (src/commands/batch.ts:346). The approval_request enum at src/commands/mcp.ts:209 elicits five: contract.sign, observation.resolve, contract.close, contract.request-changes, batch.close. signBatch and reopenContract are absent, so both can only be approved by the human typing a CLI command with a full 26-character ULID.

CONCRETE COST, 2026-08-07: the operator was handed 'kotta batch sign P-01kze2qah8rhc0agbwq5hpryns' in chat. That is the exact terminal round-trip T-01kz8tk2t53jbax6mrseka50v9 shipped to remove, and it is the second instance this week — F-01kzdjbwjtqavthcxbnz0vwxnz recorded the same thing for contract.reopen.

WHY THIS IS NOT ALREADY COVERED. F-01kzdjbwjtqavthcxbnz0vwxnz names reopen; this observation names the missing RELATION. T-01kzda6nj9hd2z45tt06fw8n0g introduces an operation registry that makes chat exposure an explicit per-operation decision, but its non-goals are binding and explicit: 'Exposing any currently terminal-only operation to chat' and 'No change to what approval_request gates'. It makes the omission legible; it does not close it. So after that contract lands, batch sign and reopen are still terminal-only — deliberately recorded as such, but still forcing the human out of the chat.

THE INVARIANT NOBODY STATES. A human gate is exactly an operation the human must decide. An operation the human must decide but cannot reach from the surface where they are asked is a broken gate, not a design choice. The set 'refuses without approval' and the set 'approval_request can elicit' should be derivable from each other, and the registry is the place where that could be asserted — one test, once the registry exists.

SECOND-ORDER CAUSE, why the message also carried a raw ULID: displayId() at src/core/identity.ts:81 has zero callers under src/ (all 12 uses are in ui/src/App.tsx, which re-implements it at App.tsx:74), and entity lookup resolves only the full minted id (findContract/findObservation call filenameMatchesId with the complete id, so a short 8-character tail or a slug does not resolve as input). An agent writing a runnable command therefore has no choice but to print the ULID. F-01kz4k6c8tej1hv8dr1p7xrhzb covers that half.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
