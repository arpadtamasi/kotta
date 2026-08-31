---
id: F-01m1bbczq2507gyqxmdzx96s2m
title: >-
  A command's help text and its declaration are two descriptions of one
  operation, and nothing keeps them in agreement
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m1bb1fhe0fsmk05swhscx62j
created_at: '2026-08-31'
---
# F-01m1bbczq2507gyqxmdzx96s2m — A command's help text and its declaration are two descriptions of one operation, and nothing keeps them in agreement

## Observation

A command's help text and its declaration are two descriptions of one operation, and nothing keeps them in agreement.

## Evidence

src/core/operations.ts carries a 'summary' per operation; src/cli/index.ts carries a separate hand-written .description() per command. Nothing compares them. Measured on 2026-08-31: 48 defineCommand calls, 33 .description() calls — 15 commands, 'batch validate' and 'task reopen' among them, print no description at all in 'kotta <group> --help' (visible in tests/integration/__snapshots__/surface-snapshot.test.ts.snap). And where both exist they can disagree: 'validate' declared 'Validate every record in the workspace.' while its help said 'Validate the Kotta workspace', and both hid that it promotes a backlog batch and commits. This is the same failure the rule 'one operation, one declaration' (BR-01m0nsyasfnjc9s4073r8zb33j) exists to end — two hand-maintained descriptions of one thing, with nothing saying when they part — one level below the surface names it already binds.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
