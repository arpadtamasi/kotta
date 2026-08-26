---
id: F-01m0xsbc9zz7d2k3t3d1yfve96
title: >-
  attach-to-existing-task never records which task, so 61 of 61 uses lost the
  link
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-26'
---
# F-01m0xsbc9zz7d2k3t3d1yfve96 — attach-to-existing-task never records which task, so 61 of 61 uses lost the link

## Observation

attach-to-existing-task never records which task, so 61 of 61 uses lost the link.

## Evidence

The disposition's whole meaning is the task it attaches to, and nothing stores one. 'kotta observation resolve' takes --disposition, --spec (amend-spec only) and --approve; there is no --task. In src/commands/observation.ts only the create-task branch writes a link: it mints a task, stamps origin: observation and source_observation on it, and sets entity.data.task. attach-to-existing-task falls through to the shared tail, which records the disposition and nothing else. Measured on this workspace: 61 observations carry 'disposition: attach-to-existing-task' and 0 of them carry a 'task:' field — every one of them recorded that it was folded into existing work without recording which. The cost is not theoretical: it is why resolving F-01m0tnv8vmjjjack09xt7w25zf reached for create-task instead, which minted a duplicate empty task (T-01m0xr5wpzz28wrbj8yxjjr948, cancelled as duplicate the same day). The observation-lifecycle state machine names the disposition as a real exit; the tool offers no way to complete it.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
