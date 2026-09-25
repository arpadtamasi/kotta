---
id: BR-01m37bp3n23m3k1s69wdtz8nnk
form: business-rule
title: Tábla az asztal kiürítéséért
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Ütés eredménye és tábla"
    - "change/specs/hungarian-casino-gameplay/spec.md · Klasszikus pontozás"
    - "operátori döntés (2026-09-24) · 8. döntés"
  quote: "8. döntés — „A tábla utáni második akció lehet ütés is (nem csak lerakás), és ha ezzel ismét kiürül az asztal, az újabb tábla."
---
# Tábla az asztal kiürítéséért

## Rule

Ha egy ütés után az asztal üresen marad, a rendszer táblát rögzít az ütő félnek. Minden tábla egy pontot ér. Ez a tábla utáni közvetlen második akcióra is áll: ha az ott végrehajtott ütés ismét kiüríti az asztalt, az újabb tábla.

## Rationale

A tábla jutalmazza az asztal teljes kiürítését, és egyben hátrányba hozza az ellenfelet, aki üres asztalra kényszerül lépni. A leosztás végi maradékelvitel ezért nem számít táblának: ott nincs ellenfél, akit hátrányba hozna.

## Scope

Csak ütésből keletkezhet, akár normál körben, akár a tábla utáni közvetlen második akcióban. Lerakásból és a leosztás végi maradék begyűjtéséből soha.
