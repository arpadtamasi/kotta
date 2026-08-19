---
id: F-026
title: >-
  A ticket review CLI maga irja be a 'Deviations: None.' szoveget — az F-019
  hazugsag-mintaja beepitett
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T02:56:12.513Z'
contract: T-031
---
# F-026 — A ticket review CLI maga irja be a 'Deviations: None.' szoveget — az F-019 hazugsag-mintaja beepitett

## Observation

A ticket review CLI maga irja be a 'Deviations: None.' szoveget — az F-019 hazugsag-mintaja beepitett.

## Evidence

src/commands/ticket.ts reviewTicket(): a review-evidencia sablonja fixen '### Deviations\n\nNone.'-t ir minden ticketbe, az agenst meg sem kerdezi. A T-026 review-jaban a deviaciok ezert csak az evidencia-szovegben elnek (DEVIACIO-1, DEVIACIO-2 jelolessel), a strukturalt mezo hamisan tiszta. Ez az F-019-ben mert 14/67 'Deviations: None + inline deviacio' mintazat mechanikus oka: nem az agens hazudik, a CLI. Javitas: a review parancs kerjen kulon --deviations parametert, vagy legalabb ne irjon 'None.'-t kerdezes nelkul.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
