---
id: F-01kzhd1dptz40r9k9n6jxwxqgh
title: 'Agents reach for ''kotta contract list'', which does not exist'
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
---
# F-01kzhd1dptz40r9k9n6jxwxqgh — Agents reach for 'kotta contract list', which does not exist

## Observation

Agents reach for 'kotta contract list', which does not exist.

## Evidence

Observed repeatedly in calling chats, including this session on 2026-08-08: an agent orienting itself in a Kotta workspace runs 'kotta contract list' and receives "error: unknown command 'list'". The CLI offers no way to enumerate contracts at all — 'kotta status' returns counts and ids, but nothing lists contracts with their titles and states. Every agent that needs the picture therefore falls back to reading .kotta/ directories directly, which is the thing AGENTS.md tells it not to do. The reach for 'list' is not a wrong guess about a differently-named command; it is the absence of the operation.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
