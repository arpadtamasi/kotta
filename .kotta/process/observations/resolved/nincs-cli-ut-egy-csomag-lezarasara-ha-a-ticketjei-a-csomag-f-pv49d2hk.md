---
id: F-01kz1fndr7se26q7bcpv49d2hk
title: >-
  Nincs CLI-ut egy csomag lezarasara, ha a ticketjei a csomag-folyamaton kivul
  keszultek el
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T15:04:39.027Z'
contract: T-01kz1g2vvgqvvzef92qdtczv8w
---
# F-01kz1fndr7se26q7bcpv49d2hk — Nincs CLI-ut egy csomag lezarasara, ha a ticketjei a csomag-folyamaton kivul keszultek el

## Observation

Nincs CLI-ut egy csomag lezarasara, ha a ticketjei a csomag-folyamaton kivul keszultek el.

## Evidence

P-005, 2026-08-02. Mindharom ticketje (T-034, T-036, T-035) done, de a csomag 'backlog'-ban all, es a CLI-ben nincs ut a lezarasara. A 'package' parancs keszlete: new, add, remove, validate, ready, start, status, finalize — 'close' nincs. Az automatikus lezaras az updateContainingPackage-ben el (src/commands/ticket.ts:395), de az KIZAROLAG a .a-team/packages/active konyvtarat nezi, es csak akkor fut, amikor egy ticket close vagy cancel tortenik. Igy ha a ticketeket egyesevel viszik vegig (ami a 'ticket execute' bevezetese ota tobbe nem kivetel, hanem gyakori ut), a csomag sosem valt active-ra, tehat sosem valik done-na sem. A latszolagos kerulout zsakutca: a 'package ready --approve' + 'package start' active-ba viszi a csomagot es koordinator-branchet nyit hozza, de utana mar nincs egyetlen zarhato ticket sem, ami a done-ba billentene — vagyis a csomag rosszabb allapotban ragadna, mint most. Kovetkezmeny: a csomag-allapot nem megbizhato osszefoglalo; a 'package status' P-005-re 'backlog'-ot mond, mikozben minden munkaja elkeszult. Rokon: a T-015 coordinator-eletciklusa mar bevezette a 'package finalize'-t az integracio utani takaritasra, de az is csak done csomagra fut.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
