---
id: F-01m0zxf1gb9phvg48ee445zj0k
title: >-
  Nothing states when a durable answer needs a decision record as well as a
  specification sentence
status: resolved
origin: human
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
disposition: amend-spec
resolved_at: '2026-08-27T16:43:32.877Z'
approved_by: cli
approved_at: '2026-08-27T16:43:32.877Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - E-01m0f0wn891kye4debkab1g2f7
---
# F-01m0zxf1gb9phvg48ee445zj0k — Nothing states when a durable answer needs a decision record as well as a specification sentence

## Observation

Nothing states when a durable answer needs a decision record as well as a specification sentence.

## Evidence

On 2026-08-26 two answers were recorded twice: D-01m0zhkpw7v7pq322pg5nycf1d says batch parallelism bounds concurrency and the same sentence landed in UC-01m0f0wn89jebbfp6rjr0fxqh1; D-01m0zxbm2k60g0apj2f5ke6pb8 says ceremony is constant while QA-01m0fp2hdkq55yrx9qr5t8pweh already promised exactly that. The operator asked whether decisions still have a place now that the spec is the agreement. E-01m0f0wn891kye4debkab1g2f7 says a decision answers a product or process question and BR-01m0fp2hdkfn519h1w84jsrqbe says the spec is the agreement, but no node says which of the two a given durable answer belongs in, or when it belongs in both. Two mechanisms depend on the answer: a task's open question is resolved only by naming a decision (BR-01m0z873stwx7szg5896gwsbry), so a durable answer recorded only as spec cannot unblock defining; and referenced decisions travel into briefs while spec nodes travel as coverage.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
