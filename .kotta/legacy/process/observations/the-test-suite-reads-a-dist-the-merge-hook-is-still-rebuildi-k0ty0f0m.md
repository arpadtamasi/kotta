---
id: F-01kznzfp4j31dnbbp8k0ty0f0m
title: >-
  The test suite reads a dist the merge hook is still rebuilding, so a run can
  fail for no reason
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-10'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:08:08.663Z'
approved_by: cli
approved_at: '2026-08-21T15:08:08.663Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kznzfp4j31dnbbp8k0ty0f0m — The test suite reads a dist the merge hook is still rebuilding, so a run can fail for no reason

## Observation

The test suite reads a dist the merge hook is still rebuilding, so a run can fail for no reason.

## Evidence

Observed on 2026-08-10 immediately after merging T-01kzn4jcktrv988d0n4ghwhjs5 into main. The integration tests spawn the built CLI at dist/cli/index.js rather than the sources, and a repository hook rebuilds dist after every merge or pull ('[a-team] rebuilding after merge/pull...'). The full suite run started while that rebuild was in flight and reported 9 failures across one file; three consecutive runs afterwards were clean at 42 files / 268 passed / 1 skipped, with no change to the working tree in between. The failing run's output was lost because the command issued to inspect it re-ran the suite instead of replaying it, so the specific failures were never captured — which is itself part of the defect: a suite whose result depends on a background build gives no signal about which of its runs to believe. Nothing coordinates the two: the tests do not check that dist is current, and the hook does not know a suite is running. A green run proves the code passes; a red one proves nothing until it is repeated.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
