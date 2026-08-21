---
id: F-030
title: >-
  Package-szintu review hianyzik — a ticketek review-ban tartasa
  egyben-reviewhoz deadlockolja a csomagot
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-030 — Package-szintu review hianyzik — a ticketek review-ban tartasa egyben-reviewhoz deadlockolja a csomagot

## Observation

Package-szintu review hianyzik — a ticketek review-ban tartasa egyben-reviewhoz deadlockolja a csomagot.

## Evidence

oneanda P-021, 2026-08-02, operator-igeny: 'vegigvinne a package-et ugy, hogy review-ban vannak a ticketek - mert az egeszet egyben akarom reviewzni; ettol nem kerul vissza a mainre egyik sem'. A mai modell ezt nem tudja: (1) startTicket a fuggosegeket done-ban koveteli, a done-hoz merge kell — igy a hullam-2 (T-108..T-114) nem indithato, amig T-107 merge-eletlen review-ban all; (2) a review allapot csak a worktree-agon el, a koordinator-ag nem latja (F-028 mintaja) — a coord/p021-en a T-107/T-110 meg ready-ben ul; (3) nincs package-szintu review kapu, pedig az egyben-atvetel pont az F-020 (deviacio-rollup) termeszetes helye. Javasolt irany: package review-mod — (a) fuggo ticket indulhasson a fuggoseg review-branchebol (stacked branch/worktree), a dep-kapu review-t is fogadjon el done helyett ebben a modban; (b) a package kapjon 'review' allapotot, ami a tagok evidenciait es deviacioit EGYBEN mutatja (F-020 rollup); (c) elfogadaskor a merge fuggosegi sorrendben, egy operatori menetben fut. Kapcsolodik: F-020, F-028, D-004 assess-kapu.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
