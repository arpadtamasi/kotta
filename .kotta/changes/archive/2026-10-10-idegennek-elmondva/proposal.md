# A modell úgy áll, ahogy egy idegennek elmondanánk

## Told to a stranger

Kotta egy szöveges specifikációt tart a repóban. Ez a változás azt kéri tőle, hogy a modellt mindig úgy rakja össze, ahogy a terméket egy idegennek elmondanánk: előbb mire való, aztán hogyan használják, aztán a változatai és ami támogatja.

## Why

Az intimity rendbetételénél rp: „leírtál nekem az appról egy nagyon jól strukturált ismertetőt —
hogy mondanád el egy idegennek — ez a feladat (a kottáé mindig)”. Az importált modell teljes volt,
mégis kilenc egyenrangú célként, ábécérendben mondta el a terméket; az ágens a chatben világosan
el tudta mondani. A modellnek az elmondást kell követnie.

## What changes

- **The model is shaped the way the product is told to a stranger** (új szabály): az ágens előbb
  néhány mondatban, idegennek mondja el a terméket a proposalban (`## Told to a stranger`), és ehhez
  igazítva *javasolja* a modellt: egy cél, amit a termék céljai szolgálnak; minden menet
  összefoglaló használati esetként; változatok kiterjesztésként; ami a termék minősége
  (privát, elérhető, időszerű), az minőségi követelmény; amit valaki csinál, az a menet melletti
  használati eset. Amit az ember nem mondott ki — a célt, a menetet, egy mérőszámot —, azt nyitott
  kérdésként teszi fel; az import továbbra is csak kérdez.
- A `kotta plan` jelzi, ha a proposalban nincs `## Told to a stranger` rész, de nem állítja meg a kaput (rp: „Jelezze, ne állítsa meg”).
- Két példa: az intimity, és a jelzés.

A buildben: a szállított szabályfájl, a `plan-change` és a workshop-skillek, az import proposalja.

## Open decisions

Nincs.
