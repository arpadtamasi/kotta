---
id: F-01m0t6j0cp4b85gxnh7h48azv4
title: 'The gap report repeats one 60-word reason 108 times, so nobody will read it'
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-24'
disposition: reject
resolved_at: '2026-08-25T23:42:51.317Z'
approved_by: cli
approved_at: '2026-08-25T23:42:51.317Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0t6j0cp4b85gxnh7h48azv4 — The gap report repeats one 60-word reason 108 times, so nobody will read it

## Observation

The gap report repeats one 60-word reason 108 times, so nobody will read it.

## Evidence

On main@1ce7c7a 'kotta gap' prints 333 lines and 122078 characters, and the sentence 'kinded on 2026-08-24' appears 108 times: every bulk-assigned admission restates the same paragraph. The summary line is correct and readable, but the body is not, and the 'Latest accepted spec delta' section repeats the whole admission text per changed node where only the change matters. Introduced by T-01m0t28mkgg06jbgd7k7fppjk0 at 1ce7c7a: the wording was written for one node and never checked against a hundred of them.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
