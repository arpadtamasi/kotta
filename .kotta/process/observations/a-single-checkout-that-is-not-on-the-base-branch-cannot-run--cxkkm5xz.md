---
id: F-01kztvbpa23qm3gdz4cxkkm5xz
title: >-
  A single checkout that is not on the base branch cannot run Kotta at all —
  every command refuses, not just start
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-12'
disposition: attach-existing
resolved_at: '2026-08-12T12:06:24.072Z'
---
# F-01kztvbpa23qm3gdz4cxkkm5xz — A single checkout that is not on the base branch cannot run Kotta at all — every command refuses, not just start

## Observation

A single checkout that is not on the base branch cannot run Kotta at all — every command refuses, not just start.

## Evidence

Found on 2026-08-12 while scoping the branch-naming work, and it sits underneath it: the cloud harness case fails long before branch naming is reached.

Reproduced in a throwaway repository: git init on `main`, `kotta init`, commit, then `git checkout -b claude/harness-branch` — one checkout, no linked worktrees, exactly the shape a hosted Claude Code session has. Both of these then fail:

    $ kotta status
    Error: Configured control branch 'main' has no checked-out control worktree. Check it out, then retry; Kotta never writes live state into a feature worktree.
    $ kotta contract new --title "Probe" --type feature
    Error: Configured control branch 'main' has no checked-out control worktree. Check it out, then retry; Kotta never writes live state into a feature worktree.

`controlPlaneRoot` (src/git/control-plane.ts:31-38) resolves the canonical writer by filtering `git worktree list` for the one whose branch is `refs/heads/<base_branch>`, and throws when there is none. Every mutation routes through it via `withControlPlaneMutation`, and `statusCommand` calls it too — so a read-only orientation command fails for the same reason.

The rule it enforces is sound where it was designed: with several linked worktrees, canonical state must not be written into a feature worktree. But it assumes the base branch is checked out *somewhere*, and a hosted environment gives one checkout on a branch of its own choosing. There, the assumption is not merely unmet — it is unmeetable without checking out the base branch, which would abandon the branch the harness pushes from.

This is the blocker under F-01kztt3mce0yk9pm7jd9dex3w5. Adopting the host's branch at `start` — the intent recorded in D-01kztv9ysf77134nbqnw28mwg5 — is correct and still needed, but on its own it would not make a hosted session work: `contract new`, `status` and every lifecycle command refuse first.

What is missing is product intent, not code: where canonical state lives when there is exactly one checkout and it is not on the base branch. Single-checkout repositories are the ordinary case outside this project, so the answer likely also covers a solo developer who never made a second worktree.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
