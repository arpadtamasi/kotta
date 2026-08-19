---
id: F-032
title: >-
  A friss-kontextusu ticket-vegrehajtas nincs parancsban es a rendszer nem is
  tereli felé — a D-009 skill-szovegben el, nem a szerszamban
status: resolved
origin: agent
observation_type: product
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T12:23:07.364Z'
contract: T-035
---
# F-032 — A friss-kontextusu ticket-vegrehajtas nincs parancsban es a rendszer nem is tereli felé — a D-009 skill-szovegben el, nem a szerszamban

## Observation

A friss-kontextusu ticket-vegrehajtas nincs parancsban es a rendszer nem is tereli felé — a D-009 skill-szovegben el, nem a szerszamban.

## Evidence

Megfigyeles a sajat repon, 2026-08-02. Ebben a futamban a T-032, T-033, T-012, T-014 es T-015 megvalositasa vegig a koordinator felhalmozott kontextusaban tortent, holott a D-009 kimondja: 'minden ticket friss agens-kontextusban fut, alapertelmezetten' es 'a koordinator-kontextusban ticket-implementacio tilos'. Semmi nem allitotta meg. Az operator vette eszre, nem a szerszam. A T-013-nal kezzel allitottuk helyre: 'ticket brief T-013' (4509 token) -> friss agens csak a brieffel -> a koordinator review-ra maradt. Ez mukodott, de vegig emberi fegyelem tartotta ossze. Ket hianyzo darab: (1) NINCS parancs ra. A 'ticket start' letrehozza a claimet, branchet es worktree-t, majd magara hagyja a hivot; a friss agens inditasa es a brief atadasa kezi lepes. Egy 'ticket execute <id>' parancs ezt egyetlen uttá tenné. (2) A rendszer nem terel felé. A T-031 mintaja itt is all: ott a CLI addig irt kéretlen 'Deviations: None.'-t, amig az oszinte ut nem lett az alapertelmezes es a kivetel explicit nyilatkozat. Ugyanez kell itt: a friss kontextus legyen a jaras, a kontextus-orokles pedig explicit, indokolt, naplozott kivetel — ne forditva. Kapcsolodik: T-026 (brief), T-031 (nyilatkozati minta), F-016 (koltsegmeres — a brief-meret az elso valos adat), F-022 (a kapuk megkerulhetok, mert a szerszam nem kenyszerit). Iranyvalto kovetkezmeny, amit el kell donteni: egy 'ticket execute' parancs a Kottat agens-futtatova is teszi, nem csak ticket-nyilvantartassa. Az 'ui' parancs mar ismer codex es claude binarist, tehat van mire epiteni, de ez termek-iranyu dontes, nem apro bovites.

Az operátor indoklása (2026-08-02), miért ez a helyes irány, és nem csak higiénia:

- **Párhuzamosítás.** Ha a végrehajtás egy parancs, akkor N ticket N ágensen fut egyszerre. Ma a koordinátor kontextusa a soros szűk keresztmetszet: minden ticket ugyanazon az egy szálon megy át. A package `parallelism` mezője már létezik, de a valóságban nem tud érvényesülni, mert nincs mit párhuzamosítani — a munka a koordinátor fejében történik.
- **Minimális kontextus.** A ticket-ágens a briefet kapja, nem az előzményt. Mérve: a T-013 briefje 4509 token. A koordinátor cserébe vékony marad — sorrendez, kapuknál megáll, jegyzőkönyvez.
- **Szennyezés.** A hosszú közös kontextusban a ticketek átfolynak egymásba: egy korábbi ticket döntése, félmondata, tévedése észrevétlenül befolyásolja a következőt. Friss kontextusban a ticket szerződése az egyetlen bemenet — ami egyben a Kotta alapállításának éles próbája is: ha a briefből nem megy, az a kotta hiányossága, nem a futásé.

## Impact hypothesis

A jelenlegi modellben a Kotta a saját alapállítását nem tudja betartatni: a végrehajtás minősége a koordinátor önfegyelmén múlik, a párhuzamosság elvi marad, a költség pedig a kontextus méretével nő — miközben a `parallelism` és a `brief` felület azt sugallja, hogy mindez már működik.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
