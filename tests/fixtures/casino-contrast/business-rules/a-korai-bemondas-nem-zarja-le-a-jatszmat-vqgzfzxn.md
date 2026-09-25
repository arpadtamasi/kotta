---
id: BR-01m37bp5mghv1yx6cqvqgzfzxn
form: business-rule
title: A korai bemondás nem zárja le a játszmát
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Győzelmi bemondás"
    - "change/design.md · 5. Azonnali és osztásvégi pontok külön számítása"
    - "operátori döntés (2026-09-24) · 3. döntés"
  quote: "3. döntés — „A bemondás elmulasztásáért és a hamis bemondásért nincs következmény; a rendszer csak elmagyarázza, miért nem szabályos."
---
# A korai bemondás nem zárja le a játszmát

## Rule

Ha a játékos a feltétel teljesülése előtt próbál bemondani, a rendszer nem zárja le a játszmát, és elmagyarázza, mely pontok nem tekinthetők még megszerzettnek. A hamis bemondásnak nincs következménye: sem pont-, sem körvesztés, sem más büntetés nem jár érte.

## Rationale

A korai bemondás a leggyakoribb kezdői hiba, mert a többségi pontok csak később válnak biztossá. A magyarázat ezért tanítási eszköz: a biztos, a várható és az osztásvégi pontok különbségét mutatja meg.

## Scope

Minden bemondási kísérlet az emberi játékostól. A gépi ellenfél csak a feltétel teljesülésekor mond be. A szankciómentesség a bemondás elmulasztására is vonatkozik.
