---
id: T-020
title: 'Rename: a-team → kotta (npm, CLI, workspace-kompatibilitás, dokumentáció)'
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-004
depends_on: []
blocks: []
branch: feat/T-020-rename-a-team-kotta-npm-cli-workspace-kompatibilitas-dokumen
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-02'
assigned_agent: claude
resolution: completed
---
# T-020 — Rename: a-team → kotta (npm, CLI, workspace-kompatibilitás, dokumentáció)

## Outcome

A termék minden felülete Kotta néven fut: npm-csomag `kotta`, CLI-bináris `kotta` (működő `a-team` aliasszal), a workspace-olvasó a `.kotta/` és a `.a-team/` könyvtárat egyaránt érti, a dokumentáció és a site az új nevet viseli. A meglévő workspace-ek (oneanda, flowbench, crm-kit) törés nélkül működnek tovább.

## Context

D-006 szakaszolta a renamet: a GitHub-átnevezés a döntéssel együtt megtörténik (alacsony kockázat, automatikus átirányítás); ez a ticket viszi a többit. A D-005 rögzítette a név indoklását; a D-004-ben parkoló szótárcsere (signal/ticket/task/goal) kifejezetten NEM része ennek a ticketnek — az külön kör, hogy a két nagy átnevezés ne keveredjen.

## Scope

- `package.json`: név `kotta`, repository/homepage/bugs URL-ek az új GitHub-címre; `bin`: `kotta` és `a-team` ugyanarra a belépési pontra.
- npm publish az új néven; a `@arpadtamasi/a-team` deprecate üzenettel mutat rá.
- Workspace-felderítés: a CLI és a UI a `.kotta/`-t keresi először, `.a-team/`-re visszaesik; init új workspace-t `.kotta/` néven hoz létre.
- Szomszéd projektek: symlink recept dokumentálva (`ln -s .a-team .kotta` vagy fordítva), az oneanda és flowbench workspace-ekben kipróbálva.
- Dokumentáció, README, site, skillek szövege: A-Team → Kotta; az `.a-team/` útvonal-említések a kompatibilitási megjegyzéssel.
- CHANGELOG-bejegyzés és verzióemelés.

## Non-goals

- A D-004 szótárcsere (signal/ticket/task/goal) — külön ticket, külön kör.
- A `.a-team/` könyvtárak tömeges átnevezése a meglévő projektekben — a symlink a híd, az átnevezés majd magától értetődő lesz, amikor a projektek maguk váltanak.
- Bármilyen viselkedésváltozás: ez a ticket nevet cserél, nem funkciót.

## Acceptance

1. `npm i -g kotta` után a `kotta --version` és az `a-team --version` ugyanazt adja.
2. Egy `.a-team/`-es meglévő workspace-en minden parancs változatlanul működik; egy symlinkelt `.kotta/`-n szintén, mindkét irányú symlinkkel tesztelve.
3. `kotta init` új projektben `.kotta/`-t hoz létre, és a validate zöld rajta.
4. A repóban és a site-on nem marad A-Team-említés, kivéve a történeti hivatkozásokat (CHANGELOG, döntések, findingok).
5. A régi npm-csomag deprecate üzenete az új nevet mondja.

## Constraints

- A meglévő workspace-ek egyetlen fájlja sem módosul a ticket hatására — a kompatibilitás a CLI-ben él, nem migrációban.
- A tesztkészletnek mindkét könyvtárnévre futnia kell; a CI-ban mindkét út lefedve.
- A publish előtt a teljes tesztkészlet zöld; az npm-név egyszer használható el, elrontani nem lehet.

## Execution notes

A szakaszolást a D-006 rögzítette — nincs itt eldöntendő.

Sorrend: workspace-felderítés kompatibilitása → bináris-alias → tesztek mindkét útra → dokumentáció-csere → verzió + publish → régi csomag deprecate. A GitHub-átnevezés (D-006/1) már megtörtént, a lokális remote-ok frissítése ide tartozik.

## Verification

Teljes tesztkészlet zölden mindkét workspace-néven; kézi füstteszt a oneanda workspace-en symlinkkel; `a-team validate` (illetve már `kotta validate`) zöld ebben a repóban.

## Open decisions

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, brief 3243 token (D-004, D-005, D-006). 34 perc, 161 tool-hivas, 96 fajl / 999 beszuras. A mechanizmus egyetlen szabaly a workspace.ts-ben: workspaceDirectoryName(root) — '.kotta/' ha van, kulonben '.a-team/'. Egy reszlet load-bearing: a SYMLINKELT jelolt veszit a valodi testverkonyvtarral szemben, mert a board a 'git archive'/'ls-tree' uton olvas, ami a symlinket link-bejegyzeskent latja, nem faként; a valodi nevre feloldas az, amitol MINDKET symlink-irany mukodik. Minden hardkodolt '.a-team' join a src/-ben ezen megy at, beleertve a 'git add <workspace-dir>'-t. Acc1: valodi globalis telepites — 'npm pack' + a clean-install canary: {"target":"kotta-0.3.0.tgz","version":"0.3.0","alias":"0.3.0"}, exit 0; a canary mostantol MINDKET nevet allitja. Koordinatori ellenorzes: a package.json bin-je {kotta, a-team} ugyanarra a belepesi pontra, es a CLI 0.3.0-t mond. Acc2 (a szerzodes veleje, visszafele kompatibilitas): a compat-teszt teljes 'ticket new -> ready -> status -> validate' kort futtat egy '.a-team/' workspace-ben ugy, hogy '.kotta/' nem keletkezik; majd mindket symlink-iranyt kulon fixture-rel, ahol a ready fajlt TOROLIK a munkafabol es a board megis visszaadja — ez bizonyitja, hogy a ref-uton valaszolt, nem munkafa-fallbackkel. Szomszed-ellenorzes MASOLATOKON (az eredetiket nem erintette): oneanda / crm-kit / flowbench pillanatkepek bajtazonos validate-eredmenyt adnak a regi a-team@0.2.2-vel es az uj CLI-vel (oneanda 42 mar meglevo hiba mindket iranyban, a masik ketto zold); valtozatlan 'ln -s .a-team .kotta' utan; es tovabbra is zold 'mv .a-team .kotta && ln -s .kotta .a-team' utan — MEG A REGI KIADOTT CLI-VEL IS, ami a gyakorlati migracios ut. UI-fusteszt a oneanda pillanatkepen symlinkkel: /api/workspace -> 164 ticket, 101 finding, 14 dontes. Acc3: 'kotta init' '.kotta/'-t hoz letre, validate zold, es a .gitattributes megkapja a '.kotta/index.md merge=union' sort. Acc4: repo-szintu grep tiszta, kiveve a szandekos maradekokat — CHANGELOG-tortenet, a README atnevezesi tablaja, a legacy teszt-fixture-ok, a LEGACY_* konstansok, a package.json 'a-team' alias, es e repo sajat '.a-team/'-je (az a kovetkezo ticket). Acc5: a deprecate NEM futott le (visszafordithatatlan); a pontos parancs a READMEben all. Koordinatori ujrafuttatas: 'npx tsc --noEmit' tiszta, 'npx vitest run' 33 fajl / 194 passed / 1 skipped, mindharom build zold, 'validate' ok:true 41 tickettel. Diff-ellenorzes: a sajat .a-team/ konyvtarbol csak a T-020 sajat ticket-mozgasa, claimje, az uj finding es az index valtozott — a workspace tartalma erintetlen. Commit eedf169. |

### Verification performed

Friss agens, brief 3243 token (D-004, D-005, D-006). 34 perc, 161 tool-hivas, 96 fajl / 999 beszuras. A mechanizmus egyetlen szabaly a workspace.ts-ben: workspaceDirectoryName(root) — '.kotta/' ha van, kulonben '.a-team/'. Egy reszlet load-bearing: a SYMLINKELT jelolt veszit a valodi testverkonyvtarral szemben, mert a board a 'git archive'/'ls-tree' uton olvas, ami a symlinket link-bejegyzeskent latja, nem faként; a valodi nevre feloldas az, amitol MINDKET symlink-irany mukodik. Minden hardkodolt '.a-team' join a src/-ben ezen megy at, beleertve a 'git add <workspace-dir>'-t. Acc1: valodi globalis telepites — 'npm pack' + a clean-install canary: {"target":"kotta-0.3.0.tgz","version":"0.3.0","alias":"0.3.0"}, exit 0; a canary mostantol MINDKET nevet allitja. Koordinatori ellenorzes: a package.json bin-je {kotta, a-team} ugyanarra a belepesi pontra, es a CLI 0.3.0-t mond. Acc2 (a szerzodes veleje, visszafele kompatibilitas): a compat-teszt teljes 'ticket new -> ready -> status -> validate' kort futtat egy '.a-team/' workspace-ben ugy, hogy '.kotta/' nem keletkezik; majd mindket symlink-iranyt kulon fixture-rel, ahol a ready fajlt TOROLIK a munkafabol es a board megis visszaadja — ez bizonyitja, hogy a ref-uton valaszolt, nem munkafa-fallbackkel. Szomszed-ellenorzes MASOLATOKON (az eredetiket nem erintette): oneanda / crm-kit / flowbench pillanatkepek bajtazonos validate-eredmenyt adnak a regi a-team@0.2.2-vel es az uj CLI-vel (oneanda 42 mar meglevo hiba mindket iranyban, a masik ketto zold); valtozatlan 'ln -s .a-team .kotta' utan; es tovabbra is zold 'mv .a-team .kotta && ln -s .kotta .a-team' utan — MEG A REGI KIADOTT CLI-VEL IS, ami a gyakorlati migracios ut. UI-fusteszt a oneanda pillanatkepen symlinkkel: /api/workspace -> 164 ticket, 101 finding, 14 dontes. Acc3: 'kotta init' '.kotta/'-t hoz letre, validate zold, es a .gitattributes megkapja a '.kotta/index.md merge=union' sort. Acc4: repo-szintu grep tiszta, kiveve a szandekos maradekokat — CHANGELOG-tortenet, a README atnevezesi tablaja, a legacy teszt-fixture-ok, a LEGACY_* konstansok, a package.json 'a-team' alias, es e repo sajat '.a-team/'-je (az a kovetkezo ticket). Acc5: a deprecate NEM futott le (visszafordithatatlan); a pontos parancs a READMEben all. Koordinatori ujrafuttatas: 'npx tsc --noEmit' tiszta, 'npx vitest run' 33 fajl / 194 passed / 1 skipped, mindharom build zold, 'validate' ok:true 41 tickettel. Diff-ellenorzes: a sajat .a-team/ konyvtarbol csak a T-020 sajat ticket-mozgasa, claimje, az uj finding es az index valtozott — a workspace tartalma erintetlen. Commit eedf169.

### Deviations

Negy iteleti dontes, mind nyilatkozva. (1) A skill-konyvtarak is atneveztek: setup-a-team -> setup-kotta, report-a-team-bug -> report-kotta-bug. A ticket 'a skillek szoveget' mondta, de a nevek meghagyasa az Acceptance 4-et buktatna es ellentmondana a README/site szovegnek. Back-compat shim nincs: a mar telepitett peldanyokat nem erinti, az uj telepitesek az uj slash-parancsokat kapjak. (2) A kornyezeti valtozok atneveztek fallbackkel: KOTTA_*, de az A_TEAM_* tovabbra is olvasodik. A ticket nem nevesitette, de termek-felulet, tehat az Acc4 ala esik, es a fallback ingyen tartja a kompatibilitast. (3) Az examples/demo-project/.a-team -> .kotta: ez szallitott dokumentacio arrol, hogy egy workspace hogy nez ki, nem e repo sajat workspace-e. (4) A CHANGELOG-bejegyzes az [Unreleased] ala kerult; a [0.3.0] szakaszt a kiadas vagja. Tovabba: a verzio 0.2.2-rol 0.3.0-ra ment, amit a ticket 'verzioemelesként' kert, de a mertekét nem rogzitette.

### Findings created

F-01kz235wrjck3amwcjwn3kw5t7 (process) — a hirdetett telepitesi verzio harom helyen hardkodolt (README, site/index.html, site/tests/site.spec.ts), semmi nem szarmaztatja a package.json-bol, es mar el is drifteltek: a site 0.1.2-t hirdetett, mikozben 0.2.2 volt kiadva, es a teszt ezt az elavult stringet rogzitette. Nem javitva.

### Known concerns

(a) A publish es a deprecate EMBERI lepes, es amig nem fut le, a 'kotta' nev szabad ugyan ('npm view kotta' ma E404), de a felhasznalok a regi csomagot latjak. A pontos parancssor a jelentesben es a READMEben all. (b) A symlink-feloldas szabalya (valodi konyvtar nyer a symlinkkel szemben) nincs kimondva a dokumentacioban, csak a kodban es a tesztekben — ha valaki mindket konyvtarat valodinak hozza letre, a viselkedes meglepo lehet. (c) A tesztkeszlet szandekosan vegyes: harom fajl '.a-team/' fixture-t hasznal, hogy mindket konyvtarnev fusson CI-ban; ez helyes, de a jovoben konnyen 'takaritasnak' esik aldozatul, ezert kommenttel van jelolve.
