---
id: F-01m0sm78y2b1vpg1msj98cvwxz
title: >-
  The gap ratchet self-check cannot pass before the work is committed, and
  nothing says so
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-24'
disposition: attach-to-existing-task
resolved_at: '2026-08-26T01:00:49.331Z'
approved_by: cli
approved_at: '2026-08-26T01:00:49.331Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0sm78y2b1vpg1msj98cvwxz — The gap ratchet self-check cannot pass before the work is committed, and nothing says so

## Observation

The gap ratchet self-check cannot pass before the work is committed, and nothing says so.

## Evidence

tests/integration/gap-ratchet.test.ts 'this workspace passes its own rule' clones HEAD, because gapReport reads a git ref rather than the working tree. A wave that lands a spec node and the code naming it therefore fails the suite until the commit exists, then passes unchanged. Hit three times in two days: on the ratchet's own wave, on T-01m0qz128k7h6vtnhnykj5sba8, and on T-01m0jdnwfg647qh8j2673emy85 at 69746e2. Reading committed state is correct and deliberate — the finding is that the failure explains none of this, so it reads as a real defect each time and costs a diagnosis.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
