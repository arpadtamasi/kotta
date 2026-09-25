---
id: D-01m0asab79kkd4z3yz5cv38e6h
title: A forma-regiszter telepítéséhez minimális TypeScript-integráció megengedett
date: '2026-08-18'
---
# D-01m0asab79kkd4z3yz5cv38e6h — A forma-regiszter telepítéséhez minimális TypeScript-integráció megengedett

## Decision

A „A specifikációs réteg: forma-regiszter, nyolc műhely-skill és a nyomonkövetés” contract
A1 feltételének teljesítéséhez megengedett a szükséges, minimális TypeScript-módosítás, hogy a
`kotta init` és a `kotta sync` a `templates/workspace/forms/` alatt szállított forma-YAML-okat
új és meglévő workspace-be is telepítse.

A forma-regiszter tartalma továbbra is kizárólag YAML-adat: a TypeScript nem tartalmazhat
forma-neveket, kötelező éleket, felismerési jeleket vagy más forma-specifikus tudást. Egy új forma
bevezetéséhez továbbra is elég egy új YAML-fájlt hozzáadni.

Ez a döntés felülírja a contract I1 és A5 azon szó szerinti részét, amely minden kód- és
`src/`-változást tilt. Az érdemi korlát megmarad: a CLI és MCP publikus műveleti felülete,
viselkedési szerződése és snapshotja nem változhat; a nyomonkövetés továbbra is opcionális skill,
nem CLI/MCP-parancs és nem validációs kapu.

## Context

A friss végrehajtás igazolta, hogy a jelenlegi `initializeWorkspace` csak a profilokat másolja,
a `sync` pedig a skilleket és az agent-szabályokat kezeli. A `templates/workspace/forms/`
hozzáadása önmagában ezért nem teljesítené A1-et. Az operátor 2026-08-18-án kifejezetten a
minimális TypeScript-integrációt választotta az automatikus telepítés elhagyása helyett.

## Consequences

- Az implementáció módosíthatja az init/sync telepítési infrastruktúráját, de nem kódolhat
  forma-specifikus szabályt TypeScriptbe.
- Új teszt hozzáadható az init és sync forma-telepítésének bizonyítására; meglévő tesztfájl
  továbbra sem módosítandó.
- Az A5 ellenőrzésében a `src/` teljes érintetlensége helyett a CLI/MCP publikus surface és
  snapshotok változatlanságát, valamint a forma-specifikus TypeScript-tudás hiányát kell igazolni.
- A contract összes többi invariantja, scope-eleme és acceptance-feltétele változatlan.
