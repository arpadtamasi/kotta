---
id: F-01kzwwsjvcbcxf5vpee4g2s4mc
title: >-
  The unconditional agent rule turns process documentation and non-product
  housekeeping into contract work
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-13'
disposition: create-contract
resolved_at: '2026-08-13T06:38:11.280Z'
contract: T-01kzwxfdabqvrtct2vzfzqzpfd
---
# F-01kzwwsjvcbcxf5vpee4g2s4mc — The unconditional agent rule turns process documentation and non-product housekeeping into contract work

## Observation

The unconditional agent rule turns process documentation and non-product housekeeping into contract work.

## Evidence

Observed on 2026-08-13 with Kotta 0.5.0. templates/AGENTS.md states “No change without an active contract” without defining a boundary for contract-worthy work. In a Kotta-enabled repository with zero active contracts, impeccable init stopped before writing PRODUCT.md and requested a documentation contract, although the requested file only captures tool and agent context and does not change product behaviour. The same wording applies equally to workflow notes, process documentation, generated context, and similar housekeeping. Existing defined contracts were unrelated. The agent followed the shipped rule as written; no CLI error occurred.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
