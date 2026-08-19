---
id: F-01m0bt3gag9p10f4rkvc4e2xry
title: 'A specifikációs munkára továbbra is contract készül, a pozitív küszöb ellenére'
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-19'
---
# F-01m0bt3gag9p10f4rkvc4e2xry — A specifikációs munkára továbbra is contract készül, a pozitív küszöb ellenére

## Observation

A specifikációs munkára továbbra is contract készül, a pozitív küszöb ellenére.

## Evidence

A most mergelt T-01m0b63d3xrhpnvbgaaedjwc92 (és a benne felolvasztott T-01m0b3jq2yjxbe173w19axk9x8) azt a szabályt szállítja, hogy contract ahhoz a munkához kell, amely ember által elfogadott, acceptance-feltételekkel ellenőrizhető termék- vagy deliverable-vállalást hajt végre, és hogy a shaping, a specifikációs csomópontok írása és a read-only traceability ebből következően contract nélkül végezhető.

A gyakorlatban ez nem érvényesül. Egy másik Kotta-projekt sessionje specifikációs munkára készít és írat alá contractokat: entitások felvétele, egy forrás szerepkód visszaállítása, valamint egy 'spec-gráf' contract review-ban. A session saját összefoglalója is spec-döntéseket sorol non-goalként (számított fogalmak nem lesznek entitások, a kolléga életciklusa nem állapotgép, a pending_purge attribútum marad) - vagyis modellezési shaping folyik, amire a szállított szabály szerint nem kellene contract.

Ez azt jelzi, hogy a küszöb szövegszinten benne van az AGENTS.md-ben, de nincs mögötte semmi, ami az agent döntését terelné: a define-contract skill nem kérdez rá, hogy a munka átlép-e a küszöbön, és a contract create/define útvonalon sincs ellenőrzés. A rule 8 ('Execute from the brief') miatt a futó agens kontextusa is a contract felé tolja a spec-munkát.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
