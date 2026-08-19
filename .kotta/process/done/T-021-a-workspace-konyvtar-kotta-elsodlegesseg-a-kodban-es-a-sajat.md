---
id: T-021
title: 'A workspace-könyvtár .kotta: elsődlegesség a kódban és a saját repo migrációja'
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-004
depends_on:
  - T-020
blocks: []
branch: feat/T-021-a-workspace-konyvtar-kotta-elsodlegesseg-a-kodban-es-a-sajat
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-02'
assigned_agent: claude
resolution: completed
---
# T-021 — A workspace-könyvtár .kotta: elsődlegesség a kódban és a saját repo migrációja

## Outcome

A `.kotta/` az elsődleges workspace-könyvtár: az init ezt hozza létre, a felderítés ezt találja meg először, a dokumentáció ezt mondja — és ez a repo maga az első migrált példány: a saját `.a-team/`-je `git mv`-vel `.kotta/` lett, visszafelé mutató symlinkkel.

## Context

D-007 felülírta a D-006/4 kompatibilitás-only tervet: a könyvtár a rename része. A T-020 megtanította a CLI-nek mindkét utat; ez a ticket fordítja meg az elsőbbséget és végzi el az első valódi migrációt — a sajátunkon, mielőtt bárki máséhoz nyúlnánk (T-022).

## Scope

- Felderítési sorrend: `.kotta/` először, `.a-team/` másodikként, mindkettő létezésekor `.kotta/` nyer és a CLI figyelmeztet a kettősségre.
- `kotta init` új workspace-t `.kotta/` néven hoz létre.
- Ebben a repóban: `git mv .a-team .kotta` + `ln -s .kotta .a-team` — egy commitban, a teljes tesztkészlet zöldje mellett.
- Minden repo-beli út-hivatkozás (tesztek, skillek, site, README) `.kotta/`-t mond; a kompatibilitást egy helyen dokumentáljuk.
- A UI fejlécben és a státuszkimenetben látszó útvonalak az új nevet mutatják.

## Non-goals

- Szomszéd projektek migrációja — az T-022.
- A `.a-team/` olvasásának megszüntetése — a kivezetés külön, későbbi döntés.

## Acceptance

1. `kotta init` üres repóban `.kotta/`-t hoz létre, validate zöld.
2. Ebben a repóban a workspace `.kotta/` alatt él, a `.a-team` symlink, és minden parancs + a teljes tesztkészlet zöld.
3. Csak `.a-team/`-et tartalmazó régi workspace változatlanul működik (kompatibilitási teszt).
4. Mindkét könyvtárt tartalmazó (nem symlink) workspace-nél a CLI kimondott figyelmeztetést ad és a `.kotta/`-t használja.
5. A repóban nincs `.a-team/` út-említés a kompatibilitási dokumentáción és a történeti fájlokon kívül.

## Constraints

- A migráció `git mv` — a fájltörténetnek követhetőnek kell maradnia.
- A symlink a repóba commitolva; Windows-viselkedése a dokumentációban jelezve (ott a checkout sima könyvtárt adhat).

## Execution notes

Sorrend: felderítés-csere tesztekkel → init-csere → saját migráció → út-említések cseréje. A saját migráció legyen külön commit, hogy a T-022 tudjon rá mintaként hivatkozni.

## Verification

Teljes tesztkészlet zölden migráció előtt és után; kézi füstteszt: status, ui, ticket validate a migrált repón.

## Open decisions

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, brief 1567 token (D-006, D-007). 27 perc, 68 tool-hivas, negy commitban. Acc1: friss 'git init' + 'kotta init' egy tmpdirben — '.kotta' jon letre es '.a-team' nem; a .gitattributes megkapja a '.kotta/index.md merge=union' sort; validate ok:true. Acc2 (a sajat feszek koltoztetese): 'git ls-tree HEAD .a-team' -> 120000 blob (link-bejegyzes), a munkafaban '.a-team -> .kotta' symlink; a 'status' a '.kotta' utat mondja; validate ok:true 42 tickettel es 12 dontessel; a 'ticket validate T-021' es a 'claim list' is atmegy; a resolveWorkspaceLocation() MINDKET belepesi pontbol (repo-gyoker es '.a-team') '.kotta'-t ad vissza. Acc3: kizarolag '.a-team/'-es workspace tovabbra is mukodik — tmpdir-proba: a status a '.a-team' utat mondja, a validate zold, a 'ticket new' oda ir, es '.kotta' NEM keletkezik. Acc4: ket VALODI konyvtar eseten a '.kotta' nyer, es a parancs stderr-en figyelmeztet, megnevezve a feloldast ('ln -s .kotta .a-team'); a stdout tovabbra is parse-olhato JSON marad. A figyelmeztetes a workspaceDirectoryName() varratbol jon, amin minden parancs athalad — tehat egyik sem tudja kihagyni —, es processzenkent egyszer szol; symlinkes hidnal nema. Acc5: 'git ls-files \| grep -v ^.kotta/ \| xargs grep .a-team' csak a szandekos maradekokat adja — README kompat-szakasz, CHANGELOG, LEGACY_WORKSPACE_DIRECTORY es docblockja, a migrate-oneanda-demo szkript kompat-listaja, egy komment, es a legacy teszt-fixture-ok. Koordinatori ellenorzes a migracios commitre: 'git diff --name-status -M c8975da^ c8975da' -> 118 darab R100 (100%-os hasonlosag), plusz egy A (a symlink) es egy M (.gitattributes) — semmi mas. Az agens ezen felul blob-hash szinten is osszevetette a mozgatas elotti es utani allapotot: BLOBS_IDENTICAL, NAMES_IDENTICAL; es a 'git log --follow' a D-001-en visszaer a migracio elotti commitig, tehat a tortenet koveti a fajlokat. Sajat ujrafuttatasom: 'npx tsc --noEmit' tiszta, 'npx vitest run' 33 fajl / 197 passed / 1 skipped (a kiindulas 194 volt), mindharom build zold, 'status' a '.kotta' utat mondja. Commitok: 4773e73, c8975da, 835dd80, 048b519 — a migracio szandekosan kulon commitben, hogy a kovetkezo ticket hivatkozhasson ra. |

### Verification performed

Friss agens, brief 1567 token (D-006, D-007). 27 perc, 68 tool-hivas, negy commitban. Acc1: friss 'git init' + 'kotta init' egy tmpdirben — '.kotta' jon letre es '.a-team' nem; a .gitattributes megkapja a '.kotta/index.md merge=union' sort; validate ok:true. Acc2 (a sajat feszek koltoztetese): 'git ls-tree HEAD .a-team' -> 120000 blob (link-bejegyzes), a munkafaban '.a-team -> .kotta' symlink; a 'status' a '.kotta' utat mondja; validate ok:true 42 tickettel es 12 dontessel; a 'ticket validate T-021' es a 'claim list' is atmegy; a resolveWorkspaceLocation() MINDKET belepesi pontbol (repo-gyoker es '.a-team') '.kotta'-t ad vissza. Acc3: kizarolag '.a-team/'-es workspace tovabbra is mukodik — tmpdir-proba: a status a '.a-team' utat mondja, a validate zold, a 'ticket new' oda ir, es '.kotta' NEM keletkezik. Acc4: ket VALODI konyvtar eseten a '.kotta' nyer, es a parancs stderr-en figyelmeztet, megnevezve a feloldast ('ln -s .kotta .a-team'); a stdout tovabbra is parse-olhato JSON marad. A figyelmeztetes a workspaceDirectoryName() varratbol jon, amin minden parancs athalad — tehat egyik sem tudja kihagyni —, es processzenkent egyszer szol; symlinkes hidnal nema. Acc5: 'git ls-files | grep -v ^.kotta/ | xargs grep .a-team' csak a szandekos maradekokat adja — README kompat-szakasz, CHANGELOG, LEGACY_WORKSPACE_DIRECTORY es docblockja, a migrate-oneanda-demo szkript kompat-listaja, egy komment, es a legacy teszt-fixture-ok. Koordinatori ellenorzes a migracios commitre: 'git diff --name-status -M c8975da^ c8975da' -> 118 darab R100 (100%-os hasonlosag), plusz egy A (a symlink) es egy M (.gitattributes) — semmi mas. Az agens ezen felul blob-hash szinten is osszevetette a mozgatas elotti es utani allapotot: BLOBS_IDENTICAL, NAMES_IDENTICAL; es a 'git log --follow' a D-001-en visszaer a migracio elotti commitig, tehat a tortenet koveti a fajlokat. Sajat ujrafuttatasom: 'npx tsc --noEmit' tiszta, 'npx vitest run' 33 fajl / 197 passed / 1 skipped (a kiindulas 194 volt), mindharom build zold, 'status' a '.kotta' utat mondja. Commitok: 4773e73, c8975da, 835dd80, 048b519 — a migracio szandekosan kulon commitben, hogy a kovetkezo ticket hivatkozhasson ra.

### Deviations

Harom tetel. (1) A 'status' kapott egy 'workspace' mezot (JSON-ban es humanban is). A Scope azt kerte, hogy az uj nev latszodjon a status kimeneteben — de a status eddig egyaltalan nem irt utat, a human kimenete 'kotta status completed.' volt. Egy mezo, egy humanize-ag. (2) Az ures repo felderitesi fallbackje mostantol '.kotta'-t ad vissza a legacy nev helyett. Az Acceptance nem mondta ki, de az 'elsodlegesseg' ezt jelenti, es a regi ertek egy olyan repora adta volna a rename elotti nevet, amelyik eppen '.kotta'-t fog kapni. Uj teszt fedi. (3) A figyelmeztetes stderr-re megy es processzenkent memoizalt — ez tudatos: a stdout igy JSON-kent parse-olhato marad. Tovabba szandekosan erintetlen: a szotar-rename es a ready->defined (kovetkezo ticket), minden szomszed workspace, es a changelog rename elotti binaris-nev emlitesei (ezt findingkent rogzitette, nem sopörte be).

### Findings created

Ket finding, es az elso KOMOLY a kovetkezo ticket szempontjabol. F-01kz25qf318bmn1t860n2rjcpt (risk) — a workspace-konyvtar atnevezese utan a BOARD URESEN OLVAS, amig az atnevezes el nem er a base refre. Ezen az agon a readWorkspace() figyelmeztet ('batch read of .kotta at b40be85 failed (pathspec .kotta did not match any files)') es 0 ticketet, 0 findingot, 0 dontest ad vissza — mert a board a base refrol olvas (T-016/D-001), ahol meg '.a-team' van. A fejlec utja helyes, a tartalom ures, es a figyelmeztetes csak a batch-hibat nevezi meg. A T-022 ezt MINDEN migralt szomszedban el fogja erni. F-01kz25qv5kenxezrzmm4m7q531 (bug) — a kiadatlan changelog meg 'a-team ui', 'a-team ticket execute', 'a-team package close' alakokat ir abban a kiadasban, amelyik atnevezi a binarist.

### Known concerns

(a) A board-uresseg (F-01kz25qf3...) nem elmeleti: a T-022 harom elo szomszedban fogja produkalni, es ott az operator azt fogja latni, hogy eltunt a munkaja. A T-022 definiciojaba be kell venni, hogy a migracios commit erje el a base refet, mielott barki megnyitja a boardot — vagy legalabb, hogy a figyelmeztetes megmondja, mi tortenik. (b) Az agens egy futasnal (negybol) 'Errors 1 error'-t latott 197 zold teszt mellett, reszletek nelkul; harom kovetkezo futas tisztan ment, en is tisztan futtattam. Nem uldozte; ha visszater, sajat findingot erdemel. (c) A Playwright site-teszt nem futott, mert nem volt a megadott verifikacios keszletben.
