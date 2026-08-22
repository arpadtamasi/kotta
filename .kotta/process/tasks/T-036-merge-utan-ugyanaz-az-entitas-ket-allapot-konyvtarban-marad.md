---
id: T-036
title: Merge utan ugyanaz az entitas ket allapot-konyvtarban marad
status: done
origin: observation
types:
  - bug
profiles: []
priority: high
risk: medium
batch: P-005
depends_on: []
blocks: []
branch: fix/T-036-merge-utan-ugyanaz-az-entitas-ket-allapot-konyvtarban-marad
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-008
assigned_agent: claude
resolution: completed
---
# T-036 — Merge után ugyanaz az entitás két állapot-könyvtárban marad

## Outcome

Két ág összemergelése után egyetlen entitás sem szerepel egyszerre két állapot-könyvtárban. Ahol a merge mégis kettőt hagyott, a `validate` megnevezi mindkét helyet, és van támogatott út a feloldására — nem kézi `git rm`.

## Context

F-008 második gyökere, amit a D-003 kifejezetten nem old meg. Az entitás állapotát ma a könyvtár kódolja (`backlog/`, `ready/`, `active/`, `review/`, `done/`). A git a könyvtárak közti mozgatást nem rendezi delete+add párként, ezért merge után mindkét példány túléli. A oneandában mérve (2026-07-26): T-039 és T-040 egyszerre `backlog` és `done`, T-041 egyszerre `active` és `backlog`, P-015 egyszerre `packages/backlog` és `packages/ready`.

Ez az azonosító-ütközéstől független hiba: akkor is előjön, ha minden azonosító egyedi (T-034). A párhuzamos, több-ágenses modell mindkettőt kiváltja, ezért a T-035 párhuzamosítása előtt ez is kell.

Rokon, de más: az F-028 arról szól, melyik git-kontextus az igazság olvasáskor; ez itt az írás/merge oldala.

## Scope

- A `validate` külön esetként nevezze meg, ha ugyanaz az azonosító két állapot-könyvtárban van, és mondja meg, melyik kettőben — ma ez a valódi azonosító-ütközéssel egy kalap alá esik.
- Determinisztikus feloldási szabály, amely az életciklus előrehaladását tiszteli: a későbbi állapot nyer.
- CLI-út a feloldásra, amely a támogatott írókon fut és naplózza, mit dobott el.
- Ugyanez a csomagokra (`packages/*`).

## Non-goals

- Az azonosító-mintázás megváltoztatása — az a T-034.
- Az olvasási szabály a git-kontextusok fölött — az az F-028.
- A könyvtár-alapú tárolás elhagyása; ez a ticket a duplikátumot szünteti meg, nem a modellt cseréli.
- A oneanda meglévő duplikátumainak visszamenőleges rendezése; a feloldó út létrejön, a futtatása külön döntés.

## Acceptance

1. Két ágon eltérően továbbvitt ugyanazon ticket merge-e után a `validate` megnevezi a duplikátumot, mindkét helyet kiírva — teszt valódi git-fixture-rel.
2. A feloldó CLI-út a későbbi életciklus-állapotot tartja meg, a másikat eltávolítja, és megnevezi, mit dobott el.
3. Ha a két példány törzse eltér, a parancs megáll és nem dönt helyettünk.
4. Csomagokra ugyanez érvényes, a P-015 alakú esetre külön teszttel.
5. Jóváhagyás nélkül a feloldás nem fut le.
6. Teljes tesztkészlet, typecheck és mindhárom build zöld.

## Verification

Git-fixture két ággal, amelyek ugyanazt a ticketet külön állapotba viszik, majd merge; ugyanez csomagra. Külön teszt a tartalom-eltérés esetére, amely bizonyítja, hogy a parancs megáll. `npx vitest run`, `npx tsc --noEmit`, mindhárom build.

## Constraints

A feloldás sosem dob el olyan példányt, amelynek törzse eltér a megtartottétól. Minden mutáció a támogatott írókon megy át. A `validate` a duplikátumot hibaként jelenti akkor is, ha a feloldást senki nem futtatja.

## Open decisions

None.

## Execution notes

A `validate` mai duplikátum-ága a `src/commands/validate.ts` `seen` térképe — `DUPLICATE_ID`-t ad, de nem különbözteti meg a „két állapot-könyvtárban ugyanaz" esetet a valódi azonosító-ütközéstől. A `STATE_MISMATCH` szabály a `src/core/validation.ts`-ben már összeveti a frontmattert a könyvtárral.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens vegrehajtasa, bemenet kizarolag az 1633 tokenes brief (benne D-003). A ket hibafajta most kulon nevet kap: DUPLICATE_ID = ket fajl EGY allapot-konyvtaron belul allitja ugyanazt az azonositot (valodi utkozes); DUPLICATE_STATE = egy azonosito TOBB allapot-konyvtarban, es az uzenet minden helyet megnevez abszolut uttal, plusz kiirja a feloldo parancsot. Uj entities.ts segedek: PACKAGE_STATES, stateDirectories(kind), entityCopies(root, kind, id) — az identitas a frontmatterbol jon, fajlnev csak tartalek, igy a legacy T-001 es a mintazott T-<ULID> is mukodik. Uj src/commands/dedupe.ts: a legmesszebb jutott eletciklus-peldanyt tartja meg, a korabbiakat torli, regenerateIndex-et hiv; megtagadja, ha a peldanyok ugyanabban a konyvtarban vannak, megall, ha barmely vesztes peldany TORZSE elter, es --approve nelkul nem fut. CLI: 'ticket dedupe <id>' es 'package dedupe <id>'. Acceptance — mind a negy fixture VALODI git merge-dzsel: Acc1: branch A ready-re viszi, a main 'cancel --resolution obsolete'-tal done-ba; a merge 'CONFLICT (rename/rename)'-t ad, mindket oldal megtartasa utan a validate 1-es exittel DUPLICATE_STATE-et jelent mindket abszolut uttal, es DUPLICATE_ID-t NEM. Acc2: 'ticket dedupe --approve' a done-t tartja, a ready-t eldobja, kiirja mindkettot; utana validate ok:true; ujrafuttatva 'nothing to resolve'-val elutasit. Acc3: eltero torzsu peldanyoknal (branch A ready-re viszi, a main 'ticket define'-nal atirja a torzset, a merge modify/delete konfliktust ad) a dedupe 1-es exittel 'different bodies' hibat ad, MINDKET fajl tulel, a DUPLICATE_STATE tovabbra is jelentve. Acc4: P-015 alak — packages/backlog + packages/ready valodi merge-bol; a validate megnevezi mindkettot, a 'package dedupe --approve' a ready-t tartja, a backlogot dobja, es jelenti a differing_fields: ['tickets']-et. Acc5: jovahagyas nelkul mindket dedupe 1-es exittel 'Human approval is required'-ot ad, mindket fajl a lemezen marad. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 129 passed / 1 skipped, 'a-team validate' ok:true. A main beemelesekor egy konfliktus volt a src/cli/index.ts humanize fuggvenyeben (a T-035 'ticket start' aga es a T-036 dedupe aga ugyanoda kerult) — koordinatorkent oldottam fel ugy, hogy mindket ag megmaradt; commit af8e494. Az identity.test.ts DUPLICATE_ID fixture-je szandekosan valtozott: eddig egy backlog fajlt masolt done-ba, ami pont a T-036 esete es most DUPLICATE_STATE-et ad — most masodik entitast masol UGYANABBA a konyvtarba, es kulon allitja, hogy DUPLICATE_STATE nincs. Commitok: f2a9c0a, 542c215, af8e494. |

### Verification performed

Friss agens vegrehajtasa, bemenet kizarolag az 1633 tokenes brief (benne D-003). A ket hibafajta most kulon nevet kap: DUPLICATE_ID = ket fajl EGY allapot-konyvtaron belul allitja ugyanazt az azonositot (valodi utkozes); DUPLICATE_STATE = egy azonosito TOBB allapot-konyvtarban, es az uzenet minden helyet megnevez abszolut uttal, plusz kiirja a feloldo parancsot. Uj entities.ts segedek: PACKAGE_STATES, stateDirectories(kind), entityCopies(root, kind, id) — az identitas a frontmatterbol jon, fajlnev csak tartalek, igy a legacy T-001 es a mintazott T-<ULID> is mukodik. Uj src/commands/dedupe.ts: a legmesszebb jutott eletciklus-peldanyt tartja meg, a korabbiakat torli, regenerateIndex-et hiv; megtagadja, ha a peldanyok ugyanabban a konyvtarban vannak, megall, ha barmely vesztes peldany TORZSE elter, es --approve nelkul nem fut. CLI: 'ticket dedupe <id>' es 'package dedupe <id>'. Acceptance — mind a negy fixture VALODI git merge-dzsel: Acc1: branch A ready-re viszi, a main 'cancel --resolution obsolete'-tal done-ba; a merge 'CONFLICT (rename/rename)'-t ad, mindket oldal megtartasa utan a validate 1-es exittel DUPLICATE_STATE-et jelent mindket abszolut uttal, es DUPLICATE_ID-t NEM. Acc2: 'ticket dedupe --approve' a done-t tartja, a ready-t eldobja, kiirja mindkettot; utana validate ok:true; ujrafuttatva 'nothing to resolve'-val elutasit. Acc3: eltero torzsu peldanyoknal (branch A ready-re viszi, a main 'ticket define'-nal atirja a torzset, a merge modify/delete konfliktust ad) a dedupe 1-es exittel 'different bodies' hibat ad, MINDKET fajl tulel, a DUPLICATE_STATE tovabbra is jelentve. Acc4: P-015 alak — packages/backlog + packages/ready valodi merge-bol; a validate megnevezi mindkettot, a 'package dedupe --approve' a ready-t tartja, a backlogot dobja, es jelenti a differing_fields: ['tickets']-et. Acc5: jovahagyas nelkul mindket dedupe 1-es exittel 'Human approval is required'-ot ad, mindket fajl a lemezen marad. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 129 passed / 1 skipped, 'a-team validate' ok:true. A main beemelesekor egy konfliktus volt a src/cli/index.ts humanize fuggvenyeben (a T-035 'ticket start' aga es a T-036 dedupe aga ugyanoda kerult) — koordinatorkent oldottam fel ugy, hogy mindket ag megmaradt; commit af8e494. Az identity.test.ts DUPLICATE_ID fixture-je szandekosan valtozott: eddig egy backlog fajlt masolt done-ba, ami pont a T-036 esete es most DUPLICATE_STATE-et ad — most masodik entitast masol UGYANABBA a konyvtarba, es kulon allitja, hogy DUPLICATE_STATE nincs. Commitok: f2a9c0a, 542c215, af8e494.

### Deviations

Harom eltres. (1) A csomag-fixture-hoz 'merge.renames false' kell a fixture-repoban: bekapcsolt atnevezes-felismeressel a backlog->ready mozgatas plusz egy backlog-beli szerkesztes egyetlen fajlla oldodik fel, es a packages/backlog + packages/ready par csak akkor all elo, ha a git NEM parositja a mozgatast delete+add-kent — ami pontosan az a mechanizmus, amit a ticket Contextje leir, es ami nagy merge-nel a rename-limit tullepesekor tortenik. Valodi git merge maradt, a teszt kommentben rogziti. (2) A brief szabalya csak a torzsre vonatkozik ('torzse elter'). A status/updated_at-on tuli frontmatter-elteres NEM blokkolja a feloldast, de a kimenet jelenti — ez a Constraint legkozelebbi olvasata, amely mellett az Acc2 es Acc4 egyaltalan teljesitheto. (3) A 'naplozza, mit dobott el' a parancs stdout/JSON eredmenye; a dedupe nem keszit git commitot (a 'ticket ready' es 'reopen' konvencioja szerint, es mert egy merge utani munkafa ritkan tiszta).

### Findings created

F-01kz1f399tdejhjwsp1x2fggq8 (risk) — a findTicket/findPackage a LEGKORABBI allapot-peldanyt adja vissza, ezert amig duplikatum letezik, minden mas parancs (ready, start, close, brief, status) az elavult peldanyon dolgozik, holott a validate jelzi a bajt es a dedupe a legmesszebb jutottat tartja meg. Az olvasasi szabaly az F-028 teruleye, ezert rogzitve es nem javitva (discovered_during: T-036).

### Known concerns

(a) A duplikatum fennallasa alatt a tobbi parancs a rossz peldanyon dolgozik — ez a fenti finding, es addig el, amig az F-028 olvasasi szabalya meg nem szuletik. (b) A dedupe hatoköre a ticketek es a packages/*; a findings/new vs findings/resolved parost a Scope nem nevezte meg, ezert kimaradt. (c) A megtartas szabalya az eletciklus-sorrend, nem a tartalom kora: ha valaki egy regebbi, de elorebb allo peldanyt hagy hatra, azt tartja meg a parancs — a torzs-egyezes vizsgalata ezt csak reszben fogja.
