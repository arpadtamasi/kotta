---
id: F-029
title: >-
  UI reload masodpercekig tart — fajlonkent kulon git show subprocess, cache
  nelkul
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T02:56:10.743Z'
contract: T-029
---
# F-029 — UI reload masodpercekig tart — fajlonkent kulon git show subprocess, cache nelkul

## Observation

UI reload masodpercekig tart — fajlonkent kulon git show subprocess, cache nelkul.

## Evidence

src/commands/ui.ts readMdFromRef(): minden entitas-fajlt kulon 'git show ref:path' spawnSync hivassal olvas a base refrol (T-016 stabil-ref olvasas). oneanda meretnel (117 ticket + 99 finding + dontesek + package-ek) ez 230+ szekvencialis, blokkolo git-subprocess RELOADONKENT, darabja 10-30ms — masodpercek, es a workspace meretevel linearisan romlik. Az operator megerositese: 'a ui reload rettento sokaig tart'. Javitasi irany: (1) egyetlen 'git cat-file --batch' stream vagy 'git archive' az osszes blobra egy subprocess-ben; (2) cache a base ref commit-hashere kulcsolva — a ref csak commitnal valtozik, ket commit kozott a reload memoriabol szolgalhato (egy rev-parse hivas a kulcs-ellenorzes); (3) a working-tree-s reszek (claims, diagnostics) kulon, olcso uton. Kapcsolodik: F-028 (ugyanaz az olvasoreteg), T-016 (a stabil-ref olvasas eredete).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
