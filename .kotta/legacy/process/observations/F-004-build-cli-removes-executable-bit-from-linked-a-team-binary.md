---
id: F-004
title: 'build:cli removes executable bit from linked a-team binary'
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-012
created_at: '2026-07-23'
disposition: attach-existing
resolved_at: '2026-08-02T15:04:29.052Z'
---
# F-004 — build:cli removes executable bit from linked a-team binary

## Observation

build:cli removes executable bit from linked a-team binary.

## Evidence

Observed on 2026-07-23 in P-003 after npm run build:cli: the globally linked a-team command failed with zsh: permission denied. The global symlink resolves into this repository at dist/cli/index.js; that file had mode -rw-r--r-- despite a node shebang. chmod +x restored a-team --help. Rebuilding must preserve or restore executable mode and regression coverage should invoke the linked binary.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
