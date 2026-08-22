---
id: F-01kzdax5af5edadf83rq792eky
title: The implemented execution state never checks whether the run changed anything
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
disposition: attach-existing
resolved_at: '2026-08-07T07:33:52.144Z'
---
# F-01kzdax5af5edadf83rq792eky — The implemented execution state never checks whether the run changed anything

## Observation

The implemented execution state never checks whether the run changed anything.

## Evidence

src/commands/execute.ts decides the execution state from a four-branch chain at lines 228-236: cancelled, launch error, non-zero exit, empty stdout. Line 242 then assigns state: failure?.state ?? 'implemented'. uncommittedChanges is computed only afterwards at line 239, stored into the record at line 255, and used at line 288 solely to append a display note. It never reaches the state decision. An agent that exits 0 and prints one character while touching no file is therefore recorded as 'implemented' and appended to the lifecycle log via appendLifecycleEvent as 'Executor <agent> completed its implementation run.' IMPORTANT for whoever fixes this: uncommittedChanges === false is the NORMAL successful outcome, because the agent is expected to commit and close requires the branch merged - line 288 renders uncommitted changes as the warning case. A naive guard on uncommittedChanges alone would misclassify every correct run as a failure. The sound emptiness signal is 'no new commits on the contract branch relative to its start baseline AND no uncommitted changes'.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
