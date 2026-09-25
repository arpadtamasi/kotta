---
id: SM-01m37bp1fefqmft38439cted1p
form: state-machine
title: A leosztás körmenete
entity:
  - E-01m37bnyb0643gykxtwj68ms8z
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Kötelező ütés és laplerakás"
    - "change/specs/hungarian-casino-gameplay/spec.md · Ütés eredménye és tábla"
    - "change/specs/hungarian-casino-gameplay/spec.md · Kéz újratöltése és várakozás"
    - "change/specs/hungarian-casino-gameplay/spec.md · Utolsó kör és maradék lapok"
    - "change/design.md · 4. A magyar körsorrend explicit állapotgép"
    - "operátori döntés (2026-09-24) · 5. döntés"
    - "operátori döntés (2026-09-24) · 8. döntés"
  quote: "5. döntés — „A következő leosztást az előző leosztás UTOLSÓ ÜTÉSÉT végrehajtó fél kezdi (ugyanaz az elv, mint az újraosztásnál és a maradéknál). Az első leosztás kezdőjét sorsolás dönti el."
---
# A leosztás körmenete

## Governed lifecycle

Egy leosztás körmenete az osztástól a pontozásig. A magyar játékmenet nem egyszerű váltott kör, ezért a ritka körsorrendi szabályok itt, egy helyen jelennek meg, nem a felület feltételeiben szétszórva.

## States

- `Osztás`: három-három kézlap, a leosztás elején négy nyílt asztali lap.
- `Normál akció`: a soron lévő fél ütést vagy — ütés hiányában — lerakást hajt végre.
- `Tábla utáni akció`: a táblát követő ellenfél-akció, amelyhez tartozhat egy közvetlen második akció; ez a második akció lerakás és ütés is lehet.
- `Várakozás`: az egyik kéz kiürült, a másiké nem; osztás nem történik.
- `Újraosztás`: mindkét kéz kiürült, és maradt lap a talonban.
- `Nyílt utolsó kör`: a talon kiürült, mindkét fél kézlapjai láthatók.
- `Maradék elvitele`: minden kézlap elfogyott, az asztali maradék az utolsó ütőé.
- `Pontozás`: a leosztás tételes pontszámítása.

## Transitions

- `Osztás` → `Normál akció`: a játszma első leosztásában a sorsolt, minden továbbiban az előző leosztás utolsó ütője kezd.
- `Normál akció` → `Normál akció`: szabályos ütés vagy lerakás után a másik fél következik.
- `Normál akció` → `Tábla utáni akció`: az ütés után az asztal üresen maradt.
- `Tábla utáni akció` → `Tábla utáni akció`: az ellenfél első akciója csak lerakás volt, és maradt kézlapja: közvetlenül még egy akciót kap, amely lerakás és ütés is lehet. Ha ez az ütés az asztalt ismét kiüríti, újabb tábla keletkezik.
- `Tábla utáni akció` → `Normál akció`: az ellenfél első akciója ütés volt, vagy a második közvetlen akció is lezajlott, vagy elfogyott a kézlapja.
- `Normál akció` → `Várakozás`: az egyik kéz kiürült, a másiké nem.
- `Várakozás` → `Újraosztás`: a másik kéz is kiürült, és maradt lap a talonban.
- `Újraosztás` → `Normál akció`: az utolsó ütést végrehajtó fél kezd.
- `Várakozás` → `Nyílt utolsó kör`: mindkét kéz kiürült, de a talon üres — az utolsó lapok kiosztása után a kezek nyílttá válnak.
- `Nyílt utolsó kör` → `Maradék elvitele`: minden kézlap elfogyott.
- `Maradék elvitele` → `Pontozás`: a maradék az utolsó ütőhöz került, tábla jóváírása nélkül.
