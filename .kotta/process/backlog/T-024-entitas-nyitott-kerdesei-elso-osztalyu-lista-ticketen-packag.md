---
id: T-024
title: 'Entitás nyitott kérdései: első osztályú lista ticketen, package-en, findingon'
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-024 — Entitás nyitott kérdései: első osztályú lista ticketen, package-en, findingon

## Outcome

Minden entitásnak (ticket, package, finding) lekérdezhető nyitott-kérdés listája van: a CLI és a UI meg tudja mutatni, mi vár még emberi válaszra egy entitáson — hogy az átbeszélés a kérdések mentén történjen, ne a teljes szöveg újraolvasásával.

## Context

A minta már él: a crm-kit T-001-e nyolc nyitott kérdés ticketesítve, és a D-004 régóta mondja, hogy az open question decision-request — „gap → decision" —, aminek valahol parkolnia kell, különben elpárolog. Ma a kérdések prózában ülnek a szekciókban: se listázni, se számolni, se státuszt adni nekik nem lehet. Az operátor igénye: az átbeszélést támogassa a szerszám — üljünk le egy entitás fölé, és lássuk a nyitott kérdéseit.

## Scope

- **Jelölés:** a nyitott kérdés strukturáltan jelölhető az entitás törzsében (az `Open decisions` szekció tételei + explicit jelölés bárhol a szövegben), stabil sorszámmal az entitáson belül (pl. `T-020/Q1`).
- **CLI:** `kotta questions <id>` — egy entitás nyitott kérdései; `kotta questions` — az összes, entitásonként csoportosítva, ranggal (blokkol-e ready-t / csak nyitott).
- **UI:** az entitás-részletben külön „Nyitott kérdések" panel; a listákban darabszám-jelvény.
- **Feloldás:** egy kérdés válasza döntésre (D-xxx) vagy szöveg-frissítésre mutat; a feloldott kérdés a történetben marad, nem tűnik el.
- A ready-kapu integrációja: a validátor a jelölt nyitott kérdésekből tudja, hogy az entitás nem defined — a mai szabad szöveges `Open decisions: None` konvenció géppel ellenőrizhetővé válik.

## Non-goals

- Nem chat és nem kommentfolyam — a kérdés az entitás állapota, nem beszélgetés róla.
- Nem önálló entitástípus (a D-004 nyitott kérdése ettől még eldöntendő): a kérdés az entitásBAN él, csak láthatóvá válik.

## Acceptance

1. Egy ticketben jelölt három kérdésből a `questions <id>` pontosan hármat listáz, sorszámmal.
2. A workspace-szintű lista minden entitástípusból összegyűjt, és megmondja, melyik blokkol defined-et.
3. A UI entitás-nézetében a panel megjelenik, és a kérdésre kattintva a szövegbeli helyére ugrik.
4. Feloldott kérdés (D-hivatkozással) a listában „resolved" státusszal látszik, a defined-kaput nem blokkolja.
5. A crm-kit T-001 nyolc kérdése az új jelöléssel felvéve — ez a valós próba.

## Constraints

- A jelölés sima markdown maradjon: git-diffben olvasható, agent kézzel is tudja írni, a formátum a séma-dokumentációban.
- Meglévő workspace-ek jelölés nélküli entitásai változatlanul érvényesek — a funkció opt-in, nem migráció.

## Execution notes

A jelölés-formátum a kényes pont: előbb azt rögzíteni egy rövid próbával a crm-kit T-001-en, csak utána CLI és UI. A sweep (T-019) `waiting-on-you` kategóriája később ebből olvashat — de az integráció nem ennek a ticketnek a része.

## Verification

CLI-tesztek a három szintre (entitás, workspace, feloldott); UI-füstteszt; a crm-kit T-001 próbája jegyzőkönyvvel.

## Open decisions

None — a D-004 „önálló entitás-e" kérdését a Non-goals kifejezetten nem itt dönti el.
