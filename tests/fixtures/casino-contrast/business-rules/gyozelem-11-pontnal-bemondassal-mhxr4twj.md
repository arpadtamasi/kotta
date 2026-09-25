---
id: BR-01m37bp5e8ws0mrd2qmhxr4twj
form: business-rule
title: Győzelem 11 pontnál, bemondással
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Győzelmi bemondás"
    - "operátori döntés (2026-09-24) · 1. döntés"
    - "operátori döntés (2026-09-24) · 2. döntés"
    - "operátori döntés (2026-09-24) · 3. döntés"
    - "operátori döntés (2026-09-24) · 7. döntés"
  quote: "1. döntés — „A játszma több leosztásból áll: a pontok leosztásonként összeadódnak, és a játszma akkor ér véget, amikor valaki eléri a 11 pontot."
---
# Győzelem 11 pontnál, bemondással

## Rule

11 biztos pont elérésekor a játékos bemondhatja a „Kint vagyok"-ot, és a rendszer győztesként lezárja a játszmát, megmutatva a pontok eredetét. Biztos pont az, amelyet a leosztás hátralévő részében már nem lehet elvenni; a többségi pontok a leosztás végén dőlnek el, ezért alaphelyzetben nem biztosak. A pontok leosztásonként összeadódnak, és a küszöb mindkét pontozási profilban 11 pont. Segített módban a rendszer jelzi, amikor a bemondás szabályosan megtehető; a gépi ellenfél automatikusan bemond és lezár, amikor eléri a feltételt.

## Rationale

A bemondás játékosi művelet, nem automatikus lezárás: ez az, ami a magyar Kaszinót játék közben döntéssé teszi, és amit meg kell tanulni. A klasszikus profil alappontjainak összege 11, ezért a küszöb pontosan a teljes alappontkészletet jelenti. A `2+2` profil alappontösszege 12, a küszöb mégis 11 marad: a küszöb a játszma hosszát szabja meg, nem az alappontkészletet tükrözi.

## Scope

Az emberi játékosra és a gépi ellenfélre egyaránt, mindkét pontozási profilban, a játszma — nem az egyes leosztás — szintjén. A bemondás elmulasztásának nincs következménye: a játszma folytatódik, és a bemondás elérhető marad.
