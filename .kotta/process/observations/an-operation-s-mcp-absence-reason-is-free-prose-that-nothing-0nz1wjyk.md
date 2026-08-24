---
id: F-01m0v2g1gjpjqn9tfz0nz1wjyk
title: >-
  An operation's MCP-absence reason is free prose that nothing checks against
  the rules it must obey
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-24'
---
# F-01m0v2g1gjpjqn9tfz0nz1wjyk — An operation's MCP-absence reason is free prose that nothing checks against the rules it must obey

## Observation

An operation's MCP-absence reason is free prose that nothing checks against the rules it must obey.

## Evidence

src/core/operations.ts:76 declares decision.create absent from the MCP surface with the reason 'Written from a reviewed draft file; a chat proposes the draft and the operator publishes it.' That reason is itself the breach. BR-01m0f0wn89zb3wfb3t3y4d20a7 says decision creation takes effect only on an explicit human yes 'given in the conversation'; UC-01m0f0wn89p42025mt5vg5012n names decision create among the six gates approved in conversation; IF-01m0f0wn89cq1pnnsta9q8wqx9 says that where the host refuses elicitation the question moves to plain chat 'rather than to the terminal'; and the shipped AGENTS.md rule 5 says never ask the human to go and run a command. The registry asserts totality as a set comparison — every declaration has a CLI path and either an MCP tool or an absence reason — but the reason is prose no rule is compared against, so a justification that contradicts an accepted business rule passes unchallenged and reads as a decision. Five other absence reasons exist; this is the one measured to conflict.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
