---
id: T-01m0b3jq2yjxbe173w19axk9x8
title: A specifikációs munka contract nélkül is végezhető
status: defined
origin: human
types:
  - feature
profiles: []
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-18'
updated_at: '2026-08-18'
---
# T-01m0b3jq2yjxbe173w19axk9x8 — A specifikációs munka contract nélkül is végezhető

## Outcome

A Kotta szállított agent-szabálya pozitívan, a contract rendeltetéséből vezeti le a kaput:
contract ahhoz a munkához kell, amely egy ember által elfogadott, acceptance-feltételekkel
ellenőrizhető termék- vagy deliverable-vállalást hajt végre. A döntést a munka célja és hatása
határozza meg, nem az, hogy fájlt ír-e vagy melyik könyvtárat érinti.

Ebből következően a lehetséges jövőbeli vállalást feltáró vagy formáló munka — kutatás,
workshop, modellezés, specifikációs csomópontok írása és read-only traceability — önmagában nem
igényel contractot, claimet, feature branch-et vagy execution worktree-t. Ez nem speciális
forma-regiszter-kivétel: ugyanannak az általános küszöbnek a következménye. Ha a specifikáció
elkészítése maga az elfogadott átadandó eredmény, vagy a shaping termék-/deliverable-végrehajtásba
fordul, arra már kell contract.

## Scenarios

- **S1 — shaping egy vállalás előtt.** Ha a felhasználó egy problémát, célt, szereplőt,
  story-t, use case-t, példát, eseményt, nyelvet, quality scenariót vagy interfész-szerződést
  akar feltárni és rögzíteni egy későbbi döntés vagy contract megalapozására, a workshop
  contract nélkül létrehozhatja vagy módosíthatja a specifikációs csomópontokat.
- **S2 — read-only elemzés.** Ha a felhasználó fedettséget, törött éleket vagy változtatási
  hatást kér elemezni, a `requirements-traceability` contract nélkül olvashat és riportolhat.
- **S3 — elfogadott végrehajtás.** Ha a kérés termékviselkedést, forráskódot, publikus
  dokumentációt, szállított artifactot vagy konfigurációt, build/release-viselkedést,
  production operationt vagy más acceptance-releváns deliverable-t hoz létre vagy módosít,
  a végrehajtás előtt contract és claim kell.
- **S4 — a spec maga a vállalás.** Ha a felhasználó egy specifikációs dokumentumot vagy
  csomópontkészletet kifejezetten végleges, átadandó és acceptance alapján elfogadandó
  eredményként kér, annak elkészítése contract-köteles.
- **S5 — vegyes kérés.** Ha egy contract nélküli shaping-folyamat végrehajtási munkába fordul,
  az agent a határon megáll: a már legitim módon elkészült spec megmarad, a termék- vagy
  deliverable-változtatás pedig csak külön contractban indul.
- **S6 — lifecycle-adat.** A contract-küszöbtől függetlenül a lifecycle-állapot, claim, event,
  decision és generált index nem projekt-artifactként szerkeszthető; ezeket továbbra is kizárólag
  Kotta-szolgáltatás módosítja.
- **S7 — aktív execution.** Egy már futó contract végrehajtója továbbra is a jóváhagyott scope-ban
  marad; a shaping fogalma nem jogosít scope-on kívüli spec- vagy más változtatásra.

## Scope

1. A `templates/AGENTS.md` első agent-szabályának átírása pozitív contract-küszöbre: először
   azt mondja meg, mely munka hajt végre elfogadott, ellenőrizhető vállalást és ezért melyikhez
   kell aktív contract és claim.
2. Ugyanez a központi szabály nevezi meg a küszöb alatti shaping-, elemzési és bounded
   housekeeping-munkát, valamint a küszöb átlépésekor szükséges megállást. A specírás ennek
   példája és következménye, nem forma- vagy könyvtár-alapú felmentés.
3. A `templates/AGENTS.md` specifikációs skill-paragrafusa röviden a központi szabályra köti a
   workshopokat és a traceabilityt; a kilenc skillbe nem kerül kilenc ismétlődő contract-kivétel.
4. A `templates/workspace/README.md` elválasztja a projekt által közvetlenül írható
   specifikációs csomópontokat a service-owned lifecycle-rekordoktól, anélkül hogy a teljes
   `.kotta/` könyvtárat felmentené.
5. Automatizált regressziós ellenőrzés bizonyítja, hogy az init/sync által szállított agent-szabály
   tartalmazza a pozitív küszöböt, a spec ebből levezetett helyét és a lifecycle-adatok védelmét.

## Non-goals

- Forma- vagy könyvtár-alapú contract-kivétellista bevezetése.
- Külön contract-boundary szakasz másolása mind a kilenc specifikációs skillbe.
- A contract-kapu gyengítése forráskódra, publikus dokumentációra, szállított artifactra vagy
  konfigurációra, buildre, release-re, production operationre vagy más promised deliverable-re.
- A lifecycle-parancsok, claim/worktree működés, CLI- vagy MCP-surface megváltoztatása.
- Új CLI- vagy MCP-írófelület a specifikációs csomópontokhoz.
- A formák mezőinek, kötelező éleinek, könyvtárainak vagy lifecycle-jének megváltoztatása.

## Acceptance

- **A1** A szállított agent-szabály elsődlegesen és explicit úgy definiálja a contract-köteles
  munkát, mint ember által elfogadott, acceptance-feltételekkel ellenőrizhető termék- vagy
  deliverable-vállalás végrehajtását.
- **A2** Ugyanez a szabály contract-köteles példaként lefedi a termékviselkedést, forráskódot,
  publikus dokumentációt, szállított artifactot/konfigurációt, build/release-viselkedést,
  production operationt és más acceptance-releváns promised deliverable-t.
- **A3** A szabály a pozitív küszöbből vezeti le, hogy a kutatás, workshop, modellezés,
  specifikációs csomópontírás és read-only elemzés contract nélkül végezhető, kivéve ha maga
  az eredmény elfogadott deliverable vagy a munka végrehajtásba lép át.
- **A4** A contract-döntés cél és hatás alapján történik, nem fájlútvonal vagy kiterjesztés
  alapján; a service-owned lifecycle-rekordok továbbra sem szerkeszthetők kézzel.
- **A5** A kilenc specifikációs skill nem kap duplikált, special-case contract-felmentést; a
  központi agent-szabály és a workspace README hordozza az egységes határt.
- **A6** `npm test` és `npm run typecheck` zöld; az új regressziós teszt az initelt
  `.kotta/AGENTS.md` fájlban és a sablonokban ellenőrzi A1–A5-öt; `src/`, CLI- és MCP-surface
  nem változik.

## Verification

- A1–A5: statikus integrációs ellenőrzés a `templates/AGENTS.md`, az initelt
  `.kotta/AGENTS.md`, a workspace README és a specifikációs skill-fájlok változáslistája felett.
- S1–S7: kézi döntési walkthrough a következő bemenetekkel: „modellezzük a problémát”,
  „ellenőrizd a fedettséget”, „implementáld ezt a viselkedést”, „szállíts végleges specifikációt”,
  valamint shaping közben felmerülő kódváltozás.
- A6: `npm test`, `npm run typecheck`, `git diff --check` és `git diff --name-only`.

## Constraints

- A contract jelentése végrehajtható, acceptance-feltételekkel review-zható és lezárható
  emberi vállalás marad.
- A contract szükségességét purpose/effect dönti el; a fájl helye legfeljebb bizonyíték, nem
  önálló döntési szabály.
- A spec contract-mentessége a shaping szerepből következik, nem a forma-regiszterből és nem a
  `.kotta/` névből.
- Aktív contract végrehajtásakor a stay-in-scope szabály elsőbbséget élvez.
- A szállított agent- és skill-szöveg nyelve angol marad.

## Open decisions

None.

## Execution notes

Az operátor 2026-08-18-án elvetette a spec-specifikus kivételként megfogalmazott megoldást.
A contract-kaput abból kell levezetni, hogy mire kell contract: elfogadott és ellenőrizhető
vállalás végrehajtására. A contract címe ennek egyik fontos következményét nevezi meg; a
megvalósítás központi szemantikai szabályt szállít, nem a specifikációs skillek foltozását.
