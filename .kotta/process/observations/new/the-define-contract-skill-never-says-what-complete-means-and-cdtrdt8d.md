---
id: F-01kzhnpeadvsq1yxhkcdtrdt8d
title: >-
  The define-contract skill never says what 'complete' means, and nothing
  re-checks completeness at handoff
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
---
# F-01kzhnpeadvsq1yxhkcdtrdt8d — The define-contract skill never says what 'complete' means, and nothing re-checks completeness at handoff

## Observation

The define-contract skill never says what 'complete' means, and nothing re-checks completeness at handoff.

## Evidence

Found on 2026-08-08 after the eight-missing-facts failure in ezchops/oneanda (F-01kzhtr1qam4bkzz1kdc26y53yb). Step 8 of skills/define-contract/SKILL.md reads 'Only after the definition is complete, call the Kotta approval_request tool for contract.sign.' The word 'complete' is never defined anywhere in the skill, so it does no work: a definition that reads well and validates is treated as complete even when the calling chat holds facts the contract does not state. The operational test is available and simple — a contract is complete when the executing agent needs nothing from this conversation — and the skill does not state it. Two separate checks are missing, not one. (1) At sign: is the contract complete in that sense. (2) At handoff to a fresh context: has anything been learned since it was signed. The oneanda case shows why the second cannot be folded into the first — the conversation kept producing facts after signing (that the animation was the source of truth, where the numbers stood, what the spec had worded wrongly), and the caller itself named them while offering to bypass the fresh context. Neither check can move into the CLI: 'kotta validate' sees the contract's structure, never the conversation, so the judgement necessarily belongs to the calling agent and therefore to the skill and the rules channel.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
