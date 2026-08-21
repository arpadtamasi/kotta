---
id: F-01m0f4fd8r3eapgd38f5c4wer9
title: >-
  An observation has no exit into the spec, so every constructive noticing has
  to become a contract
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0f4fd8r3eapgd38f5c4wer9 — An observation has no exit into the spec, so every constructive noticing has to become a contract

## Observation

An observation has no exit into the spec, so every constructive noticing has to become a contract.

## Evidence

schemas/observation.schema.json enumerates six dispositions: create-contract, attach-to-existing-contract, investigate, accept-risk, reject, merge-duplicate. None of them changes the specification. The two non-contract exits are refusals — reject and merge-duplicate — and accept-risk records a decision not to act. So the only constructive door out of an observation leads to a contract. Measured on this workspace's 45 resolved observations: 28 create-contract, 15 attach-existing, 1 reject, 1 merge-duplicate. 43 of 45 exited into a contract; investigate and accept-risk were never used once. The two earlier boundary findings show the same shape — F-01kzwwsjvcbcxf5vpee4g2s4mc and F-01m007x3gsqznhbcnytnjqpfy5 both resolved as create-contract, because nothing else was selectable. This is the mechanical reason the workspace keeps producing contracts about contracts: an observation is in practice a contract feeder. It matters more now that '.kotta/spec/' is a first-class namespace (12 node kinds, 82 nodes here) that rule 1 says may be freely shaped, and that T-01m0bvztry5z4j3k72m9zs70ym makes contracts reference and validate spec nodes. The natural flow — notice something, amend the specification, and let the gap between the amended spec and the running system generate the contracts — is unavailable, because the first step has no disposition. Raised by the human on 2026-08-20: 'observation spec modositast is szulhet, sot leginkabb azt - az egy eszrevetel barhol.'

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
