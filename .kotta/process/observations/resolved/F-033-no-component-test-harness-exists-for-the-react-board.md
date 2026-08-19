---
id: F-033
title: No component-test harness exists for the React board
status: resolved
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-013
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T16:47:46.869Z'
contract: T-01kz1nzpnafm6n5t0fz43g7nwh
---
# F-033 — No component-test harness exists for the React board

## Observation

No component-test harness exists for the React board.

## Evidence

T-013's Verification asks for component tests (default, validation, consent, loading, error, success, cancellation, duplicate activation) for board UI, but the repository has no React component test setup: package.json has no jsdom, @testing-library/*, or vitest environment config, and vitest.config.ts runs node-only tests. UI behaviour today can only be verified through source-contract assertions in tests/integration/ or through Playwright against a running surface (site/tests/site.spec.ts). Any UI ticket whose verification names component tests is therefore unsatisfiable as written until a harness exists.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
