---
id: SM-01m37bp1nk95fg15p29dvqfx1w
form: state-machine
title: A játszma életciklusa
entity:
  - E-01m37bny4mfzpk0j726whyc09c
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Győzelmi bemondás"
    - "change/specs/hungarian-casino-gameplay/spec.md · Klasszikus pontozás"
    - "change/specs/offline-mobile-pwa/spec.md · Helyi állapotmegőrzés"
    - "operátori döntés (2026-09-24) · 1. döntés"
    - "operátori döntés (2026-09-24) · 2. döntés"
    - "operátori döntés (2026-09-24) · 5. döntés"
  quote: "1. döntés — „A játszma több leosztásból áll: a pontok leosztásonként összeadódnak, és a játszma akkor ér véget, amikor valaki eléri a 11 pontot."
---
# A játszma életciklusa

## Governed lifecycle

Egy teljes játszma élete az indítástól a lezárásig, a leosztások fölött.

## States

- `Indítva`: a pakli megkeverve, a profil rögzítve, az első leosztás kezdője kisorsolva, az első leosztás fut.
- `Leosztás fut`: a leosztás körmenete zajlik.
- `Leosztás pontozva`: a leosztás pontjai kiszámítva és tételesen megjelenítve.
- `Bemondható`: valamelyik fél elérte a 11 biztos pontot; segített módban a rendszer jelzi.
- `Lezárva`: a bemondás megtörtént, a rendszer győztest hirdetett.
- `Félbehagyva`: a játékos elhagyta az alkalmazást, az állapot mentve; folytatható.

## Transitions

- `Indítva` → `Leosztás fut`: a kisorsolt kezdő játékos következik.
- `Leosztás fut` → `Leosztás pontozva`: minden kézlap elfogyott és a maradék elvitele megtörtént.
- `Leosztás pontozva` → `Bemondható`: valamelyik fél halmozott biztos pontja elérte a 11-et.
- `Bemondható` → `Lezárva`: az emberi fél bemondja a győzelmet, vagy a gépi ellenfél automatikusan bemond.
- `Leosztás fut` → `Félbehagyva` → `Leosztás fut`: mentés és folytatás ugyanazon az eszközön.
- `Leosztás pontozva` → `Leosztás fut`: egyik fél sem érte el a 11 pontot, ezért új leosztás indul; a játszmapontok megmaradnak, és az előző leosztás utolsó ütője kezd.
