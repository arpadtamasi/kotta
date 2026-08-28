---
id: F-01m1459gr68tzycg8fdvgxqgan
title: >-
  The sweep's undeclared-deviation reads a prose section instead of the link, so
  doing the right thing never clears it
status: new
origin: human
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m1459gr68tzycg8fdvgxqgan — The sweep's undeclared-deviation reads a prose section instead of the link, so doing the right thing never clears it

## Observation

The sweep's undeclared-deviation reads a prose section instead of the link, so doing the right thing never clears it.

## Evidence

Reported from a project on 2026-08-27: 'az observation new --discovered-during ... letrehozza es visszakoti az observationt, de a sweep kizarolag a lezart task regi, szoveges Observations created: None mezojet nezi'. Measured here: src/commands/sweep.ts:170 decides the category from reviewSection(body, 'Observations created') on the closed task, and the file contains zero references to discovered_during - the field observation new --discovered-during actually writes, after validating the task and appending a lifecycle event (src/commands/observation.ts:61-68). The prose section is written once, at review submission, so on a done task it cannot be changed through the product at all: the only paths are reopening the task or hand-editing a Kotta-owned process file, which the reporting agent correctly refused to do. The category therefore reports thirty items in this workspace on a basis nothing can satisfy, which teaches its readers to ignore the report. Shipped in the sweep on 2026-08-26 by this session.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
