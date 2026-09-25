---
id: T-034
title: 'Koordinacio-mentes entitas-azonosito, hogy ket ag ne tudjon utkozni'
status: done
origin: observation
types:
  - bug
profiles: []
priority: high
risk: medium
batch: P-005
depends_on: []
blocks:
  - T-035
branch: fix/T-034-koordinacio-mentes-entitas-azonosito-hogy-ket-ag-ne-tudjon-u
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-008
assigned_agent: claude
resolution: completed
---
# T-034 — Koordináció-mentes entitás-azonosító, hogy két ág ne tudjon ütközni

## Outcome

Két, egymásról nem tudó ágon **ezután** létrehozott entitás azonosítója soha nem esik egybe. Az azonosító mintása nem igényel allokátort, zárat vagy közös base-refet. A már meglévő szekvenciális azonosítók változatlanul maradnak és továbbra is működnek — a workspace vegyes azonosító-térrel is valid.

## Context

F-008 és D-003. A `nextId()` a jelenlegi ág fájljait pásztázza és max+1-et ad — két ág ugyanazt a számot osztja ki. A oneandában ez már két valódi ütközést termelt (F-008 és T-049 egyaránt két különböző entitást jelentett), és ma ebben a repóban is megismétlődött: a T-013-at vivő friss ágens `finding new`-t hívott a worktree-jében, miközben a koordinátor ugyanazt tette a főágon — mindkettő F-032 lett, kézzel kellett átszámozni, és az `index.md` is konfliktált.

A D-003 az irányt eldöntötte: a gépi identitás legyen koordináció-mentes, idő-rendezhető azonosító (ULID/KSUID), az emberi hivatkozás pedig a cím/slug.

**A D-010 szűkíti ezt: a meglévő azonosítókat nem bántjuk.** Nincs migráció, nincs átszámozás, nincs hivatkozás-átírás — a `T-034` és társai maradnak, a workspace tartósan vegyes azonosító-terű lesz. A D-003 „Consequences" szakasza teljes migrációt vetített előre; azt a részt a D-010 ejtette. Cserébe a ticket elveszti az egyetlen visszafordíthatatlan részét, és a oneanda 163 ticketje sem mozdul.

Ez a ticket blokkolja a párhuzamos, több-ágenses végrehajtást: amíg az azonosító ütközhet, a T-035 (`ticket execute`) által lehetővé tett párhuzamosság adatromlást termel.

## Scope

- Új azonosító-mintázó a `T-`/`F-`/`P-`/`D-` entitásokhoz: idő-rendezhető, koordináció-mentes, allokátor nélkül. A típus-előtag megmarad, hogy a típus továbbra is az azonosítóból látszódjon.
- A `nextId()` helyére a mintázó lép az új entitások létrehozásakor; a pásztázás-és-max+1 megszűnik.
- A `validate` mindkét alakot elfogadja, és `DUPLICATE_ID`-t ad, ha két entitás mégis egy azonosítón osztozik.
- Az `index.md` újragenerálása determinisztikus és merge-barát: két ág független entitás-felvétele ne termeljen konfliktust.
- Az új entitások fájlneve `slug + rövid id-utótag`, ágak között is ütközésmentesen; a meglévő fájlnevek változatlanok.

## Non-goals

- **A meglévő azonosítók bármilyen érintése**: nincs migráció, nincs átszámozás, nincs fájlnév-változás, nincs hivatkozás-átírás — sem itt, sem a oneandában.
- Az F-008 másik gyökere — ugyanaz az entitás egyszerre két állapot-könyvtárban a merge után — külön ticket (T-036).
- Az olvasási oldal (melyik git-kontextus az igazság) az F-028 külön munkája.
- A cím/slug alapú emberi hivatkozás bevezetése a meglévő számok helyett; a rövid id-utótag megjelenítésén túl nincs új UI.

## Acceptance

1. Két külön worktree-ben, egymás ismerete nélkül létrehozott ugyanolyan típusú entitás azonosítója különbözik, és a két ág merge-e után a `validate` zöld — teszt valódi git-fixture-rel.
2. A meglévő szekvenciális azonosítójú entitások változatlanok maradnak: a `validate` elfogadja őket, feloldhatók, és a rájuk mutató hivatkozások működnek — teszt egy vegyes azonosító-terű fixture-ön.
3. Egyetlen meglévő fájl neve, azonosítója vagy hivatkozása sem változik a ticket landolásától — a repó `git diff`-je nem tartalmaz átszámozást.
4. A `validate` `DUPLICATE_ID`-t ad, ha két entitás mégis egy azonosítón osztozik.
5. Két ág független entitás-felvétele után az `index.md` merge-e nem termel konfliktust.
6. Teljes tesztkészlet, typecheck és mindhárom build zöld; `a-team validate` ok — ebben a repóban és a oneanda workspace-én is, változtatás nélkül.

## Verification

Git-fixture, amely két worktree-t hoz létre, mindkettőben entitást mint, majd összemergeli az ágakat és futtatja a `validate`-et. Vegyes azonosító-terű fixture, amelyben régi szekvenciális és új entitások keresztre hivatkoznak. A 3. feltétel `git diff --stat` ellenőrzéssel. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`, `build:ui`, `build:site`.

## Constraints

A meglévő entitásokhoz nem szabad hozzányúlni. A workspace-nek vegyes azonosító-térrel is validnak kell lennie, határozatlan ideig — ez nem átmeneti állapot, hanem a végállapot. Minden mutáció a támogatott írókon megy át.

## Open decisions

None.

## Execution notes

Az irány a D-003-ban eldőlt, azt nem kell újranyitni — csak a migrációs következményét ejtettük. Érintett pontok: `src/filesystem/entities.ts` (`nextId`, `findTicket`, `idFromFilename`), `src/core/validation.ts` (`INVALID_ID`, `FILENAME_ID_MISMATCH` — ma `/^(?:T-\d{3,}|O-\d+(?:\.\d+)?)$/`, ezt kell kibővíteni, nem lecserélni), `src/filesystem/workspace.ts` (`regenerateIndex`), és minden `finding`/`ticket`/`package`/`decision` író.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens vegrehajtasa, bemenet kizarolag a 2730 tokenes brief (benne D-003 es D-010). Azonosito-formatum: '<tipus>-<26 karakteres ULID>', pl. T-01kz1dbba2pr3bg05z1f68c1xn — 48 bites ezredmasodperc-belyeg + 80 bit veletlen, kisbetus Crockford base32; a tipus-eloTag megmarad, igy a tipus tovabbra is az azonositobol latszik, es az alak idorendezheto allokator, zar es kozos base-ref nelkul. Uj entitasok fajlneve 'slug-<utolso 8 karakter>.md'. Acc1: az identity.test.ts ket VALODI linkelt worktree-t hoz letre, mindkettoben ticketet, findingot es packaget mint egymas ismerete nelkul, majd osszemergeli az agakat: minden azonosito kulonbozik, a fajlnevek a slug+rovid alakot koveti, es a 'validate' ok:true. Acc2: vegyes azonosito-teru fixture — kezzel irt T-001-legacy-work.md es egy mintazott ticket kolcsonosen hivatkozik egymasra depends_on/blocks mezon at; a 'validate', a 'ticket validate' mindkettore, a 'status' es egy 'ticket ready' atmenet a legacy azonositon mind sikeres, a fajlneve valtozatlan. Acc3 (a legfontosabb kikotes): koordinatori ellenorzes 'git diff --stat main...HEAD -- .a-team' → mindossze 4 fajl: a T-034 sajat ready→active mozgasa, a claimje, az uj finding, es az index.md sora. Egyetlen meglevo entitas sem lett atszamozva vagy atnevezve. Acc4: DUPLICATE_ID mindket azonosito-alakra parameterezett teszttel — masodik allapot-konyvtarba duplikalva a 'validate' 1-es exittel DUPLICATE_ID-t ad. Acc5: az index.md merge-konfliktusa megszunt; az 'a-team init' mostantol '.a-team/index.md merge=union' attributumot ir, es a repo is megkapta a .gitattributes-t. Az agens bizonyitotta, hogy a megoldasnak foga van: a .gitattributes torlesevel ugyanaz a forgatokonyv 'CONFLICT (content): Merge conflict in .a-team/index.md' hibaval all meg. Acc6: koordinatori ujrafuttatas a worktree-ben — 'npx tsc --noEmit' tiszta, 'npx vitest run' 24 fajl / 115 passed / 1 skipped, mindharom build zold, 'a-team validate' ok:true 35 tickettel es 10 dontessel; a legacy T-013 tovabbra is feloldhato. A oneandan (csak olvasva): az uj CLI {MISSING_PROFILE_SECTION: 7, DEVIATION_MISMATCH: 35} — bajtre azonos a valtozas elotti CLI kimenetevel, uj hibaosztaly nincs, es az ottani munkafa tiszta maradt. Implementacio: uj src/core/identity.ts (mintazas, ketfele elfogadott alak, rovid utotag, fajlnev-szarmaztatas), a nextId() megszunt, az identitas mostantol mindig a frontmatterbol jon es soha nem a fajlnevbol — ez volt a fo hullamzas a validate, status, listIds es a UI ticket-kulcsozasa fele. Commit 8128580. |

### Verification performed

Friss agens vegrehajtasa, bemenet kizarolag a 2730 tokenes brief (benne D-003 es D-010). Azonosito-formatum: '<tipus>-<26 karakteres ULID>', pl. T-01kz1dbba2pr3bg05z1f68c1xn — 48 bites ezredmasodperc-belyeg + 80 bit veletlen, kisbetus Crockford base32; a tipus-eloTag megmarad, igy a tipus tovabbra is az azonositobol latszik, es az alak idorendezheto allokator, zar es kozos base-ref nelkul. Uj entitasok fajlneve 'slug-<utolso 8 karakter>.md'. Acc1: az identity.test.ts ket VALODI linkelt worktree-t hoz letre, mindkettoben ticketet, findingot es packaget mint egymas ismerete nelkul, majd osszemergeli az agakat: minden azonosito kulonbozik, a fajlnevek a slug+rovid alakot koveti, es a 'validate' ok:true. Acc2: vegyes azonosito-teru fixture — kezzel irt T-001-legacy-work.md es egy mintazott ticket kolcsonosen hivatkozik egymasra depends_on/blocks mezon at; a 'validate', a 'ticket validate' mindkettore, a 'status' es egy 'ticket ready' atmenet a legacy azonositon mind sikeres, a fajlneve valtozatlan. Acc3 (a legfontosabb kikotes): koordinatori ellenorzes 'git diff --stat main...HEAD -- .a-team' → mindossze 4 fajl: a T-034 sajat ready→active mozgasa, a claimje, az uj finding, es az index.md sora. Egyetlen meglevo entitas sem lett atszamozva vagy atnevezve. Acc4: DUPLICATE_ID mindket azonosito-alakra parameterezett teszttel — masodik allapot-konyvtarba duplikalva a 'validate' 1-es exittel DUPLICATE_ID-t ad. Acc5: az index.md merge-konfliktusa megszunt; az 'a-team init' mostantol '.a-team/index.md merge=union' attributumot ir, es a repo is megkapta a .gitattributes-t. Az agens bizonyitotta, hogy a megoldasnak foga van: a .gitattributes torlesevel ugyanaz a forgatokonyv 'CONFLICT (content): Merge conflict in .a-team/index.md' hibaval all meg. Acc6: koordinatori ujrafuttatas a worktree-ben — 'npx tsc --noEmit' tiszta, 'npx vitest run' 24 fajl / 115 passed / 1 skipped, mindharom build zold, 'a-team validate' ok:true 35 tickettel es 10 dontessel; a legacy T-013 tovabbra is feloldhato. A oneandan (csak olvasva): az uj CLI {MISSING_PROFILE_SECTION: 7, DEVIATION_MISMATCH: 35} — bajtre azonos a valtozas elotti CLI kimenetevel, uj hibaosztaly nincs, es az ottani munkafa tiszta maradt. Implementacio: uj src/core/identity.ts (mintazas, ketfele elfogadott alak, rovid utotag, fajlnev-szarmaztatas), a nextId() megszunt, az identitas mostantol mindig a frontmatterbol jon es soha nem a fajlnevbol — ez volt a fo hullamzas a validate, status, listIds es a UI ticket-kulcsozasa fele. Commit 8128580.

### Deviations

Harom eltres, mind nyilatkozva. (1) A dontesek fajlneve identitas-alapu marad (D-<ULID>.md), nem slug+utotag: a validateDecisionFile ma kikenyszeriti, hogy a fajlnev pontosan <id>.md legyen, es ezt a workspace README is dokumentalja — a slug-os fajlnev egy meglevo invariánst tort volna el haszon nelkul. (2) Szerzodesen tuli javitas: a 'ticket new' nem hozta letre a .a-team/backlog konyvtarat, ha hianyzott. A git nem viszi at az ures konyvtarakat linkelt worktree-be, ezert friss agon a ticket-felvetel egyszeruen elhasalt — es ezt az Acc1 megkoveteli. A tobbi iro (finding, package, ready, review, close, cancel) mar tartalmazta ugyanazt az egysorost. (3) 13 teszt-fajl fixture-je hardkodolt T-001/P-001 azonositokat feltetelezett; ezek igazitasa nem uj funkcio, de erdemi diff.

### Findings created

F-01kz1dbnrr9tcghwnr1rg6fqm9 — a 'decision create' friss worktree-ben elhasal, ha a .a-team/decisions konyvtar ures (ENOENT: scandir <worktree>/.a-team/decisions). Ugyanaz a csalad, mint a fenti (2) javitas, de a 'decision create' kivul esik a T-034 identitas-szerzodesen, ezert az agens rogzitette es nem javitotta (discovered_during: T-034).

### Known concerns

(a) Az index.md 'merge=union' attributuma a git oldalan oldja meg a konfliktust: a generalt fajlnal ez helyes, de az union-merge nem tud rendezni — ket ag felvetelei egymas utan kerulnek be, a sorrend a merge iranyatol fugg. Ujragenaralaskor helyreall. (b) A .gitattributes-t az 'a-team init' irja, tehat a MEGLEVO workspace-ek (koztuk a oneanda) nem kapjak meg automatikusan — ott az index.md tovabbra is konfliktalhat, amig valaki kezzel fel nem veszi a sort. Ez tudatosan kimaradt, mert a D-010 tiltja a meglevo workspace-ek bantasat, de kovetkezmenykent szamon tartando. (c) A workspace innentol tartosan vegyes azonosito-teru — ez a D-010 szerinti vegallapot, nem atmenet.
