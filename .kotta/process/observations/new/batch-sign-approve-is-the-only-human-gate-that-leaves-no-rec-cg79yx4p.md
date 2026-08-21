---
id: F-01m0jd8010zwe9kf4kcg79yx4p
title: batch sign --approve is the only human gate that leaves no receipt
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-21'
---
# F-01m0jd8010zwe9kf4kcg79yx4p — batch sign --approve is the only human gate that leaves no receipt

## Observation

batch sign --approve is the only human gate that leaves no receipt.

## Evidence

signBatch (src/commands/batch.ts:221-247) performs a human-approved backlog->defined transition with no stampReceipt call and no lifecycle event, while task.sign (task.ts:205), task.close (:486), task.cancel (:594), task.reopen (:649), observation.resolve (observation.ts:147), batch.close (batch.ts:449) and decision.create (decision.ts:30) all stamp approval receipts. An approval with no durable record contradicts BR consequential-transitions-are-human-gates and the public claim that every approval leaves a receipt. Found during the 2026-08-21 promise-vs-capability audit.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
