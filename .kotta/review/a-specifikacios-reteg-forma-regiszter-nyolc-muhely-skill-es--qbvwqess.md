---
id: T-01m0apvt0hm3wcmwa6qbvwqess
title: 'A specifikációs réteg: forma-regiszter, nyolc műhely-skill és a nyomonkövetés'
status: review
origin: human
types:
  - feature
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01m0apvt0hm3wcmwa6qbvwqess-a-specifikacios-reteg-forma-regiszter-nyolc-muhely-skill-es-
pull_request: null
created_at: '2026-08-18'
updated_at: '2026-08-18'
assigned_agent: codex
worktree: .worktrees/T-01m0apvt0hm3wcmwa6qbvwqess
execution_mode: fresh
branch_origin: created
start_ref: HEAD
start_commit: 891c428223791c6a0472d80c1474e1e690ff11b2
---
# T-01m0apvt0hm3wcmwa6qbvwqess — A specifikációs réteg: forma-regiszter, nyolc műhely-skill és a nyomonkövetés

## Outcome

Egy Kotta-projekt a szoftverről szóló tudást nevezett, kanonikus formákban rögzíti a `.kotta/`
alatt — cél, aktor, user story, use case, üzleti szabály, példa, entitás, állapotgép, minőségi
forgatókönyv, interfész, szótárfogalom —, szigorúan markdownban, és egy skill megmondja, hol lóg
a levegőben valami. Az UML és a követelménytervezés terminológiája a szókincs; a merevsége nem:
semmi nem kötelező, a számonkérés csak a leírt csomópontok kötelező élein fut, és a kimondott
hiány elfogadott állapot, nem hiba. A formák adatként vannak leírva, nem kódként: új formát egy
yaml fájl hozzáadása vezet be.

## A közös modell

Minden csomópont egy markdown fájl, `<slug>-<rövid id>.md` néven — a D-003 és a meglévő
`entityFilename` konvenció szerint: az olvasható rész vezet, a gép az id-t használja. A fájl
könyvtára a formája: `.kotta/user-stories/`, `.kotta/use-cases/`, `.kotta/entities/` stb.
A frontmatter hordozza az azonosságot és az éleket; a törzs a forma tartalmát. Mermaid a
törzsben megengedett illusztráció; a kanonikus tartalom a szöveg és a frontmatter, mert azt
lehet lintelni és diffelni.

```yaml
---
id: E-01m0…        # mintázott, ütközésmentes
form: entity
title: Kompetenciamátrix
owner: A-…         # opcionális: kit kérdezz róla
used_by: [UC-…]    # forma-specifikus élmezők
accepted:          # kimondott hiányok, indokkal
  - "state-machine: a v1-ben nincs életciklusa"
---
```

A formák regisztere `.kotta/forms/<forma>.yaml` — a `profiles/` mintájára, `kotta init`/`sync`
telepíti. Egy bejegyzés kimondja a forma kötelező mezőit, kötelező éleit (irány, cél-forma és a
kérdés, amit a hiánya feltesz) és a felismerési jeleit a beszélgetésben.

A tizenegy szállított forma és kanonikus forrása: goal (Impact Mapping), actor (UML),
user-story (XP/Cohn), use-case (Jacobson), business-rule (Ross), example (Specification by
Example / Gherkin), entity (ER/DDD), state-machine (UML/Harel), quality-attribute (SEI QAS),
interface (Design by Contract), glossary-term (DDD Ubiquitous Language). A decision nem új
forma: a meglévő `D-` rekord az ADR.

A kötelező élek — minden más él opcionális:

| forma | kötelező | a kérdés, amit a hiány feltesz |
|---|---|---|
| goal | ≥1 mérés (example vagy quality-attribute) | miből tudjuk meg? |
| actor | ≥1 use case vagy story hivatkozza | mit csinál valójában? |
| user-story | actor és ≥1 example | kié, és mi bizonyítja? |
| use-case | actor, goal és ≥1 example | kié, melyik célért, mi bizonyítja? |
| business-rule | ≥1 example | mi törne el, ha megsértenék? |
| example | ≥1 alany (story, use case, szabály, QA) | mit bizonyít? |
| entity | ≥1 használó | miért létezik? |
| state-machine | a kormányzott entity | minek az élete? |
| quality-attribute | ≥1 verifikáció | ki méri, hol? |
| interface | ≥1 hivatkozó use case vagy entity | ki használja? |
| glossary-term | — | — |

## Scenarios

- **S1 — üres réteg néma.** *Adott* egy workspace spec-csomópont nélkül. *Amikor* a
  nyomonkövetés fut, *akkor* nincs kérdés és nincs hiba.
- **S2 — a kérdés a csomópontból jön.** *Adott* egy user story example nélkül. *Amikor* a
  nyomonkövetés fut, *akkor* egyetlen kérdést tesz fel, a story címével, a regiszterben rögzített
  kérdéssel.
- **S3 — a vállalt hiány csendes.** *Adott* ugyanez a story `accepted` bejegyzéssel. *Akkor*
  nincs kérdés; a hiány a „vállalt" listában jelenik meg az indokával.
- **S4 — a törött hivatkozás hiba.** *Adott* egy él nem létező id-ra. *Akkor* a jelentés
  hibaként nevezi meg, a hivatkozó fájllal.
- **S5 — új forma kód nélkül.** *Adott* egy kézzel hozzáadott `forms/risk.yaml`. *Akkor* a
  nyomonkövetés az új forma csomópontjait ugyanúgy számon kéri, semmilyen kódváltozás nélkül.
- **S6 — hatáselemzés.** *Adott* egy csomópont id-ja. *Akkor* a skill felsorolja, mi hivatkozik
  rá közvetlenül és közvetve — mit ránt magával a változása.

## Invariants

- **I1** Tisztán markdown és yaml: se CLI-parancs, se MCP-eszköz, se kódváltozás; mindkét
  felület snapshot-azonos marad.
- **I2** Semmi nem kötelező: a spec-réteg nélküli workspace érvényes, `kotta validate`
  viselkedése változatlan.
- **I3** A skillek opcionálisak maradnak: semmi nem függ a jelenlétüktől (AGENTS.md-elv).
- **I4** A nyomonkövetés jelentés, soha nem kapu: nem blokkol sem sign-t, sem close-t.
- **I5** A terminológia kanonikus, a notáció szabad: egy forma sem követel diagramot.

## Scope

1. `templates/workspace/forms/` — a tizenegy forma yaml-ja: kötelező mezők, kötelező élek a
   kérdéseikkel, felismerési jelek; `init` és `sync` telepíti.
2. Nyolc műhely-skill a `skills/` alá, a kanonikus gyakorlat nevén: `impact-mapping`,
   `story-mapping`, `use-case-modeling`, `example-mapping`, `event-storming`,
   `ubiquitous-language`, `quality-scenarios`, `design-by-contract`. Mindegyik három dolgot tud:
   miről ismeri fel a formáit a beszélgetésben, milyen kérdésekkel tölti ki rendesen, és mikor
   ne használd. Draftként ír, sosem kérdez előre kitöltetlen sablont.
3. `requirements-traceability` skill: a fedettségi jelentés (S1–S5) és a hatáselemzés (S6),
   a vállalt hiányok kezelésével. Kimenete rangsorolt munkalista, a lelógó élek kérdéseivel.
4. Minden forma yaml-ja mellé egy kidolgozott valódi példa a skill törzsében — a mai tanulság:
   egy igazi példány többet dönt el, mint három bekezdés.
5. `templates/AGENTS.md` skill-listájának bővítése, hogy a `sync` a kilenc új skillt telepítse
   és hirdesse.

## Non-goals

- Kódváltozás bármelyik felületen: a brief hivatkozás-feloldásának kiterjesztése a spec-formákra
  külön contract, ez a réteg előbb bizonyít.
- Board-nézet, CLI-parancs, `validate`-kapu a spec-rétegre.
- Ellentmondás-detektálás (két csomópont, ami összekötve is mást mond) — olvasó pass, külön munka.
- Meglévő dokumentumok automatikus importja.
- A draft → agreed életciklus kikényszerítése; ebben a körben minden csomópont egyenrangú.
- A staffing vagy más fogyasztó projekt tényleges spec-rétegének megírása.

## Acceptance

- **A1** Friss `kotta init` után a `forms/` a tizenegy yaml-lal és a kilenc skill telepítve van;
  `kotta sync` meglévő workspace-be ugyanígy teszi. (S1 környezete)
- **A2** Az S1–S6 forgatókönyvek egy próba-workspace-en kézzel végigjátszva a leírt viselkedést
  adják; a próba jegyzőkönyve a review evidence része.
- **A3** Minden forma-yaml teljes: kötelező mezők, kötelező élek kérdéssel, felismerési jelek —
  egy hiányos fixture-yaml a nyomonkövetési skill saját szabálya szerint bukik. (S5 negatívja)
- **A4** Mindegyik műhely-skillben van „mikor ne használd" szakasz és legalább egy valódi,
  kitöltött példa-csomópont.
- **A5** `npm test` és `npm run typecheck` zöld, egyetlen meglévő tesztfájl sem módosult;
  a CLI és az MCP felület érintetlen. (I1)

## Verification

- A2: temp könyvtárban `git init` + `kotta init`, az S1–S6 lépések végigjátszása a skill
  utasításai szerint; a kimenetek a review evidence-be kerülnek.
- A1, A5: `npm test` (a sync/init meglévő tesztjei), `npm run typecheck`, `git diff --stat`
  a `src/` érintetlenségére.
- A3, A4: fájlonkénti ellenőrzőlista a review evidence-ben, forma- és skill-névvel.

## Constraints

- A regiszter adat, nem kód: a formákhoz tartozó tudás a yaml-ban és a skillekben él, nem egy
  TypeScript táblában — a `PROFILE_REQUIREMENTS`-ből tanult lecke kötelez.
- A skillek nyelve angol (a meglévő skillek konvenciója); a csomópontok nyelve szabad.
- A fájlnév-konvenció a meglévő `entityFilename` séma; új id-alakot nem vezetünk be.
- Egy contract — mert egynemű, kód nélküli, egy ágens által egy kontextusban szállítható
  markdown-készlet; a felbontása tíz sign/close kapura ceremónia lenne tartalom nélkül.

## Open decisions

None.

## Execution notes

- A bizonyítéklánc a 2026-08-18-i munkából: a staffing-retró 40 leletéből 34-et fed le ez az
  öt formacsalád; öt verifikálatlan üzleti szabályból öt adott valódi hibát; a formák megléte
  önmagában nem védett (p95-eset) — ezért végződik minden kötelező él verifikációban.
- Az operátor döntései a beszélgetésből: forma-könyvtárak közvetlenül a `.kotta/` alatt; slug
  elöl, rövid id hátul; a teljes skillkészlet egyben; mermaid illusztrációként igen, kanonikus
  tartalomként nem; UML-terminológia markdown-médiumban.
- Az entitás könyvtára `entities/` — az operátor vázlata `data-structures/`-t írt, de a
  kanonizált irány kérésére az ER/DDD-név került be; olcsó átnevezni, ha mégis a vázlat kell.
- A `T-01m0apr10hgh3zhh2t5s4wf2xr` placeholder e contract szűkebb című elődje; duplikátumként
  vezetendő ki erre hivatkozva.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| **A1** Friss `kotta init` után a `forms/` a tizenegy yaml-lal és a kilenc skill telepítve van; | A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb. |
| **A2** Az S1–S6 forgatókönyvek egy próba-workspace-en kézzel végigjátszva a leírt viselkedést | A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb. |
| **A3** Minden forma-yaml teljes: kötelező mezők, kötelező élek kérdéssel, felismerési jelek — | A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb. |
| **A4** Mindegyik műhely-skillben van „mikor ne használd" szakasz és legalább egy valódi, | A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb. |
| **A5** `npm test` és `npm run typecheck` zöld, egyetlen meglévő tesztfájl sem módosult; | A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb. |

### Verification performed

A1: tests/integration/specification-layer.test.ts proves fresh init installs exactly 11 complete form YAML files and all 9 skills; sync restores missing bundled forms while preserving project-owned and custom definitions. A2: manual trial workspace passed S1-S6: empty layer returned no work; a story without evidence produced the registry question; accepted evidence moved it to Accepted gaps; a dangling id was a broken-reference error with its file; a complete custom risk form participated without code while an incomplete form produced a registry error; impact traversal returned direct and indirect referrers. A3: the integration test parses all 11 YAML files and checks required fields, edge direction, fields, source/target forms, minimum, question, and recognition signals; manual negative custom-form check passed. A4: all 8 workshop skills contain When not to use plus worked canonical nodes covering all 11 forms; the integration test verifies this mapping. A5: npm run typecheck passed; npm test passed 47/47 files, 321 tests with 1 intentional skip; build passed; no existing test file changed; CLI and MCP suites and snapshots remained green. git diff --check passed; implementation commit f1ed5fb.

### Deviations

Human-approved decision D-01m0asab79kkd4z3yz5cv38e6h permits the minimal TypeScript init/sync installation integration and supersedes only the literal no-code/src-untouched clauses of I1/A5. Form-specific knowledge remains YAML-only; public CLI/MCP surfaces are unchanged. No other deviations.

### Observations created

A1 form installation contradicts the no-code invariant — F-01m0as3gk50qm7d8hfp15dnp69; resolved in implementation direction by D-01m0asab79kkd4z3yz5cv38e6h.

### Known concerns

None.
