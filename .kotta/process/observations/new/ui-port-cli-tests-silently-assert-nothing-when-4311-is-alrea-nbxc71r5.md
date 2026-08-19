---
id: F-01kz1kdr45j5k28zvqnbxc71r5
title: ui-port-cli tests silently assert nothing when 4311 is already taken
status: new
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-01kz1g2vyhfn5ezzvvyzn4w2gr
created_at: '2026-08-02'
---
# F-01kz1kdr45j5k28zvqnbxc71r5 — ui-port-cli tests silently assert nothing when 4311 is already taken

## Observation

ui-port-cli tests silently assert nothing when 4311 is already taken.

## Evidence

tests/integration/ui-port-cli.test.ts:82 and :106 do 'const blocker = await occupy(DEFAULT_UI_PORT); if (!blocker) return;' — when another process already holds 4311 the two fallback tests pass without executing a single assertion. On this machine 4311 was occupied during the whole T-01kz1g2vyhfn5ezzvvyzn4w2gr run (node check: EADDRINUSE), so 'an occupied default port falls back and both UIs serve their own workspace' and 'human output names the selected url, workspace and the fallback it performed' were green while verifying nothing. A busy 4311 is the very condition those tests exist for: the guard should distinguish 'someone else already made it busy' (proceed) from 'this machine cannot bind 4311 at all' (skip), as tests/integration/ui-open.test.ts now does with holdDefaultPort().

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
