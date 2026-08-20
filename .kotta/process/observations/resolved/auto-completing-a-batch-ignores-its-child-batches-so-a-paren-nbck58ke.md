---
id: F-01m0f1mqaydrtkx3x2nbck58ke
title: >-
  Auto-completing a batch ignores its child batches, so a parent with direct
  contracts can close while children are open
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: create-contract
resolved_at: '2026-08-20T07:47:33.904Z'
contract: T-01m0f27fc9ds5y3rm0h2fjxngc
---
# F-01m0f1mqaydrtkx3x2nbck58ke — Auto-completing a batch ignores its child batches, so a parent with direct contracts can close while children are open

## Observation

Auto-completing a batch ignores its child batches, so a parent with direct contracts can close while children are open.

## Evidence

src/commands/contract.ts:685 updateContainingBatch marks a batch done when every id in its 'contracts' array is done, without reading 'batches'; a parent holding both direct contracts and child batches auto-closes on its last direct contract while a child is still open. closeBatch (src/commands/batch.ts:478) checks the whole subtree - children and subtreeContracts - so the explicit path and the automatic path disagree. Membership allows the mix: updateBatchContracts adds contracts to any backlog batch, updateChildBatches adds children to the same batch. Found 2026-08-20 while auditing the spec nodes against main.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
