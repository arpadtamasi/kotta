---
id: F-01kz1pyenv49cygqcwhqqt57nj
title: >-
  tests/integration/ui-port-cli.test.ts is flaky: afterEach times out closing
  held servers
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01kz1nzpnafm6n5t0fz43g7nwh
created_at: '2026-08-02'
---
# F-01kz1pyenv49cygqcwhqqt57nj — tests/integration/ui-port-cli.test.ts is flaky: afterEach times out closing held servers

## Observation

tests/integration/ui-port-cli.test.ts is flaky: afterEach times out closing held servers.

## Evidence

Observed on the T-01kz1nzpnafm6n5t0fz43g7nwh worktree at base commit d687d4a, before any change (clean tree). 'an occupied default port falls back and both UIs serve their own workspace' failed twice in a row with 'Error: Hook timed out in 10000ms' pointing at the afterEach at tests/integration/ui-port-cli.test.ts:14, which kills spawned CLI children and then awaits server.close() on the held sockets. A later identical run of the full suite passed, so it is a flake, not a hard break — the close() promise appears to wait on keep-alive connections the two spawned 'a-team ui' processes still hold. It fails the whole 'npx vitest run' gate intermittently and is unrelated to any UI-harness change.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
