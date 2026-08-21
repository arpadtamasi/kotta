---
id: F-01kz26mjpax1387cnjphd95n90
title: >-
  A ticket brief nem szedi fel a mintazott azonositoju donteseket — a szkenner
  csak szamjegyes D-xxx alakot ismer
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: reject
resolved_at: '2026-08-21T15:06:04.453Z'
approved_by: cli
approved_at: '2026-08-21T15:06:04.453Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kz26mjpax1387cnjphd95n90 — A ticket brief nem szedi fel a mintazott azonositoju donteseket — a szkenner csak szamjegyes D-xxx alakot ismer

## Observation

A ticket brief nem szedi fel a mintazott azonositoju donteseket — a szkenner csak szamjegyes D-xxx alakot ismer.

## Evidence

Elesben elkapva, 2026-08-02 ejjel, a T-023 briefjenek osszeallitasakor. A ticket Contextje kifejezetten hivatkozik a szotar-dontesre (D-01kz240dn155hb97h6px6n2p85), amely az EGESZ ticket alapja — a brief megis csak a ['D-004','D-010'] parost hozta. Ok: a src/commands/ticket.ts:327 mintaja /\bD-\d{3,}\b/g, tehat kizarolag szamjegyekbol allo azonositot fog. A T-034 ota az ujonnan mintazott azonositok ULID-ok (D-01kz240dn155hb97h6px6n2p85), amelyekben betuk is vannak — ezeket a szkenner nem latja. Kovetkezmeny: minden ticket, amely a T-034 utan szuletett dontesre hivatkozik, ugy indul vegrehajtasra, hogy a dontes NINCS a briefjeben. Nema hiba: a 'missingDecisions' mezo sem jelez, mert a szkenner elo sem allitja a hivatkozast, amit aztan hianyolhatna. A hatas pontosan azt a mechanizmust rontja el, amiert a brief letezik: a D-009 szerint a ticket-agens a briefet kapja a koordinator kontextusa helyett — ha a brief kihagyja a dontest, az agens azt sem tudja, hogy letezik. Ma este ez tortent volna a T-023-mal, ha nem veszem eszre kezzel: a szotar-atnevezes ticketje a szotar-dontes nelkul indult volna el. Ugyanez a mintazat valoszinuleg mashol is el: barhol, ahol a kod 'D-\d' vagy 'T-\d' alaku regexet hasznal entitas-hivatkozas felismeresere. A T-034 a mintazast vezette be, de a HIVATKOZAS-FELISMEROK atvizsgalasa nem volt a scope-jaban.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
