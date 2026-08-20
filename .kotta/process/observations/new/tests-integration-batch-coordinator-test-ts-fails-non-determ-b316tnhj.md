---
id: F-01m0f521m0j5f0we3hb316tnhj
title: >-
  tests/integration/batch-coordinator.test.ts fails non-deterministically, on a
  different test each time
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0f521m0j5f0we3hb316tnhj — tests/integration/batch-coordinator.test.ts fails non-deterministically, on a different test each time

## Observation

tests/integration/batch-coordinator.test.ts fails non-deterministically, on a different test each time.

## Evidence

Observed 2026-08-20 across four runs of the same file on two worktrees built from main. Run A (full suite, worktree T-01m0f27ebnwvrqgbx44rarvy6y): 'cleanup never touches unrelated resources > the batch file, contract files and remote refs survive every refusal' failed. Run B (full suite, worktree T-01m0f27cwtzc2dbgv24ctjgjm8, concurrent with A): 'legacy batches without coordinator metadata > the P-002 shape: refuses while the checkout still carries changes, succeeds once they are handled' failed. Run C (that file alone, worktree T-01m0f27cwtzc2dbgv24ctjgjm8): 24 passed. Run D (that file alone, worktree T-01m0f27ebnwvrqgbx44rarvy6y): 1 failed. Run E (same file, same worktree, immediately after D): 24 passed. A different test fails each time and a re-run clears it, so the file is order- or timing-dependent rather than broken by any one change. It cost two contracts a clean suite result and forced three extra 2-minute runs to tell a real failure from noise. Distinct from F-01kz1pyenv49cygqcwhqqt57nj, which is ui-port-cli.test.ts and names a specific afterEach timeout.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
