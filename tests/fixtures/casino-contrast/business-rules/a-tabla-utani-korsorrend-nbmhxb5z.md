---
id: BR-01m37bp3vaatdke8pvnbmhxb5z
form: business-rule
title: A tábla utáni körsorrend
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Ütés eredménye és tábla"
    - "change/design.md · 4. A magyar körsorrend explicit állapotgép"
    - "operátori döntés (2026-09-24) · 8. döntés"
  quote: "8. döntés — „A tábla utáni második akció lehet ütés is (nem csak lerakás), és ha ezzel ismét kiürül az asztal, az újabb tábla."
---
# A tábla utáni körsorrend

## Rule

Ha egy játékos táblát csinál, és az ellenfél első következő akciója csak egy lap lerakása, akkor az ellenfél — ha maradt kézlapja — közvetlenül még egy akciót kap, mielőtt a kör visszatérne a táblát készítő játékoshoz. Ez a második akció lehet lerakás és ütés is; ha az ütés az asztalt ismét kiüríti, az újabb tábla. Ha az ellenfél első akciója ütés, az ütés után a szokásos sorrendben a másik játékos következik.

## Rationale

Tábla után az ellenfél üres asztalra lép, ahol ütni definíció szerint nem tud; a második akció ezt a kényszerhelyzetet egyenlíti ki. Enélkül a tábla aránytalanul erős lenne.

## Scope

Csak a tábla utáni közvetlen ellenfél-akciókra: legfeljebb kettőre, amelyek közül a második ütés is lehet. Nem érvényes a leosztás végi maradékelvitelre, mert az nem tábla.
