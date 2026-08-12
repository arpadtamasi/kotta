---
id: F-01kzm9hppbvg3gxzj48xccqsm9
title: 'A submitted contract cannot be abandoned: review has no exit but forward'
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-09'
disposition: attach-existing
resolved_at: '2026-08-12T09:35:31.927Z'
---
# F-01kzm9hppbvg3gxzj48xccqsm9 — A submitted contract cannot be abandoned: review has no exit but forward

## Observation

A submitted contract cannot be abandoned: review has no exit but forward.

## Evidence

Measured on 2026-08-10 in goschool-web, on a deploy-pipeline contract that became obsolete after submission. cancelContract accepts only 'backlog' and 'defined' and says review contracts 'exit through reopen/close'. reopenContract from 'review' moves the contract to 'active' — from which cancel refuses again (not backlog/defined), reopen refuses (not review/done), and close requires review. The operator went round the loop and stopped with a contract sitting in 'active' with no work in it and no way out. The same wall stands for any submitted contract whose work is later thrown away. This is the review-side entry to the family already recorded as F-01kzhjhe5t9exnxr4fxvjsfgbq, F-01kzhna04m3pnghkchc26y53yb and F-01kzhnkbpdfc2v4bste7bbdr58, and it differs in intent: those are about repairing a contract, this is about abandoning one. Kotta can retire work it never started and work it finished, but not work it submitted. T-01kzhnsncw8znqdn14rf5d4tfp closes it indirectly — revise takes an active contract to backlog, where cancel accepts it — so the path becomes reopen, revise, cancel: three commands, none of which is named after abandoning anything.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
