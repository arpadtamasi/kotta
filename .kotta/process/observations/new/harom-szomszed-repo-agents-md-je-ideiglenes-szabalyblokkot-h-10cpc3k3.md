---
id: F-01kz3swfa5xh6rvxzq10cpc3k3
title: >-
  Harom szomszed repo AGENTS.md-je ideiglenes szabalyblokkot hordoz, aminek az
  eltavolitasara semmi nem fog emlekeztetni
status: new
origin: agent
observation_type: technical-debt
confidence: high
severity: medium
discovered_during: T-01kz3kx1ex19tjw82tbd1366pk
created_at: '2026-08-03'
---
# F-01kz3swfa5xh6rvxzq10cpc3k3 — Harom szomszed repo AGENTS.md-je ideiglenes szabalyblokkot hordoz, aminek az eltavolitasara semmi nem fog emlekeztetni

## Observation

Harom szomszed repo AGENTS.md-je ideiglenes szabalyblokkot hordoz, aminek az eltavolitasara semmi nem fog emlekeztetni.

## Evidence

2026-08-03-an harom szomszed repo kapott vagy frissitett AGENTS.md-t: /Users/rp/Dev/ezchops/oneanda/AGENTS.md (frissitve), /Users/rp/Dev/progos/crm-kit/AGENTS.md (uj), /Users/rp/Dev/thalesnano/flowbench/AGENTS.md (uj). Mindharom tartalmaz egy 'Rules for agents' blokkot a vegrehajtas-ideju szabalyokkal (scope->observation, nincs kitalalt szandek, --approve emberi kapu, review-ig nem close-ig, brief-fegyelem).

Ez a blokk szandekosan ideiglenes: a T-01kz3kx1ex19tjw82tbd1366pk azt szallitja, hogy ugyanezeket a szabalyokat a kotta contract brief fejlece hordozza, tehat a vegrehajto agens a terméktol kapja meg oket, nem egy masolt markdown fajltol. Amint az a contract done, a harom fajlbol a blokk kihuzhato, es marad a belepes (ez a repo Kottaval megy, .kotta a kanon, nincs valtoztatas contract nelkul) meg a projekt-resz.

A baj: ezt eddig csak egy chat-mondat mondta ki. A harom fajlban semmi nem jelzi, hogy a blokk ideiglenes; egyik sem hivatkozik a T-01kz3kx1ex19tjw82tbd1366pk-ra, es nem is tehetnek ertelmesen, mert az egy masik repo workspace-eben el. Egy kesobb erkezo agens veglegesnek latja oket. Fordítva is torik: ha valaki a contract leszallitasa ELOTT huzza ki a blokkot, egy ideig sehol nem lesznek a szabalyok.

Ket kovetkezmeny, amit el kell donteni: (a) mi a trigger - a contract lezarasa nem general kovetkezmenyt masik repoban, es a Kottaban nincs cross-repo hivatkozas; (b) ha marad a duplikacio, akkor a brief es a harom AGENTS.md ugyanazt a szoveget hordozza ket helyen, es a ketto elcsuszik - ez ugyanaz a driftmintazat, amit a F-01kz3k2axqqy6r4rgqmgt5ybtt eloszor leirt, csak most mar harom repora sokszorozva.

Felfedezve akkor, amikor az operator rakerdezett, hogy egy jovobeli agens ertene-e a chatben megfogalmazott tervet. Nem ertene.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
