---
id: F-01kz3k7e3a6g28h5j29mg56yk6
title: >-
  Az entitast letrehozo parancsok nem irjak ki az azonositot ember-olvasható
  kimenetben, pedig a README ezt allitja
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: F-01kz3k2axqqy6r4rgqmgt5ybtt
created_at: '2026-08-03'
---
# F-01kz3k7e3a6g28h5j29mg56yk6 — Az entitast letrehozo parancsok nem irjak ki az azonositot ember-olvasható kimenetben, pedig a README ezt allitja

## Observation

Az entitast letrehozo parancsok nem irjak ki az azonositot ember-olvasható kimenetben, pedig a README ezt allitja.

## Evidence

A README 'Install and create your first contract' szakasza kimondja: 'Every command that creates an entity prints its identifier.' A humanize() (src/cli/index.ts:29-58) viszont csak negy parancsra ad sajat formazast - contract dedupe/batch dedupe, contract start, status, decision create -, minden mas eredmeny a 'kotta <command> completed.' fallbackre esik. Igy a 'kotta contract new', a 'kotta observation new' es a 'kotta batch new' ember-olvashato modban nem irja ki a frissen mintazott azonositot; az id csak --json mellett erheto el (data.id), ahogy a tests/integration/brief.test.ts is olvassa. Kozvetlenul megfigyelve: 'kotta observation new --type improvement --title ...' futasa 'kotta observation new completed.' sort adott, es az azonositot (F-01kz3k2axqqy6r4rgqmgt5ybtt) csak a .kotta/observations/new konyvtar listazasabol lehetett megtudni. Ez pont a mintazott ULID-azonositoknal faj a legjobban, mert azok nem kitalalhatok es nem sorszamozottak, es kapcsolodik ahhoz a korabbi eszrevetelhez, hogy a bare id-k az agens-feluleteken amugy is nehezen kovethetok (F-013). Felfedezve F-01kz3k2axqqy6r4rgqmgt5ybtt vizsgalata kozben.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
