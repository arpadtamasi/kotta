---
id: T-029
title: >-
  UI reload masodpercekig tart — fajlonkent kulon git show subprocess, cache
  nelkul
status: done
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: feat/T-029-ui-reload-masodpercekig-tart-fajlonkent-kulon-git-show-subpr
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-029
assigned_agent: claude
resolution: completed
---
# T-029 — Hotfix: a UI workspace-olvasása batch-elt és cache-elt legyen

## Outcome

A UI reload nagy workspace-en (200+ entitás) is egy másodpercen belül fut. A base refről olvasás nem fájlonkénti `git show` subprocess, hanem egyetlen batch-hívás, és két commit között cache-ből megy.

## Context

F-029: a `readMdFromRef` minden entitás-fájlt külön `git show ref:path` spawnSync-kel olvas — a oneandánál 230+ blokkoló subprocess reloadonként, másodpercekig. Az operátor megerősítette élő használatban. Hotfix: a viselkedés (mit olvasunk, honnan) NEM változik, csak a hogyan.

## Scope

- A base ref alatti `.a-team/` fájlok tartalmát EGY subprocess adja: `git cat-file --batch` a `git ls-tree -r` kimenetére fűzve (vagy egyetlen `git archive` kibontás memóriába).
- Cache a base ref commit-hashére kulcsolva: reload előtt egy `git rev-parse <base>` — ha a hash azonos, a ref-oldali tartalom memóriából jön; a working-tree-s részek (claims, diagnostics, nem-committed állapot) továbbra is frissen olvasódnak.
- A meglévő olvasási szemantika (mikor olvasunk refről vs. working tree-ből) változatlan — az F-028 olvasási-szabály kérdése NEM ennek a ticketnek a tárgya.

## Non-goals

- Semmi új szemantika, semmi UI-változás — csak teljesítmény.
- Az F-028 (állapot-széttartás, olvasási szabály) külön, tervezett munka.

## Acceptance

1. Egy 200+ entitásos szintetikus workspace-en a workspace-adat összeállítása legfeljebb 2 git-subprocess-t indít (rev-parse + batch), nem fájlonként egyet — teszt bizonyítja (subprocess-számlálással vagy a hívási út egységtesztjével).
2. Azonos base-hash mellett a második összeállítás nem indít batch-olvasást (cache-találat) — teszt bizonyítja.
3. Új commit a base refen érvényteleníti a cache-t — teszt bizonyítja.
4. A meglévő ui-data tesztek változatlanul zöldek (szemantika nem változott).

## Constraints

- A cache folyamaton belüli memória — nincs lemez-cache, nincs invalidálási démon.
- A `maxBuffer` marad bőséges; a batch-olvasás hibája fájlonkénti fallbackre eshet vissza, hangos figyelmeztetéssel.

## Execution notes

A `git ls-tree -r --format` adja a blob hasheket; a `cat-file --batch` stdin-jére hash-listát tolva egy menetben jön minden tartalom. A parse-réteg (gray-matter) érintetlen.

## Verification

`npm run build:cli` zöld; `npx vitest run` teljes készlet zöld; kézi füstteszt: `a-team ui` a saját repón, reload-idő érzékelhetően csökken.

## Open decisions

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Acc1: 210-entitasos fixture-on a workspace-osszeallitas legfeljebb 2 git-subprocess (rev-parse + archive), spawn-szamlalos teszttel; tartalom-helyesseg (210 ticket, cimek/statuszok) ellenorzve. Acc2: azonos base-hash mellett a masodik osszeallitas 1 hivas (rev-parse), se archive, se show — cache-talalat teszttel. Acc3: uj commit a base refen invalidal — archive ujrafut, az uj ticket megjelenik. Acc4: meglevo ui-data tesztek valtozatlanul zoldek. Teljes keszlet: 15 fajl / 41 passed / 1 skipped (elozetesen letezo skip). Implementacio: egyetlen 'git archive --format=tar' + memoriabeli ustar-parser, folyamat-szintu cache resolve(root)+commit-hash kulcson; hibanal hangos stderr-warning es fajlonkenti fallback (kulon teszttel). Meres a valos repon: hideg 111 ms, meleg 38 ms. DEVIACIOK (friss agens nyilatkozata): (a) base-branchen allo elsodleges konyvtarnal +1 git status kell a nem-committed felvetelhez — a szigoru 2-es garancia ref-only osszeallitasra all, on-base reload 3 hivas, kulon teszttel rogzitve; a szerzodes Acc1-e es a Scope frissesseg-koveteleye aritmetikailag utkozott, az agens jelezte (helyes feloldas); (b) archive valasztva ls-tree+cat-file helyett, mert az ketto subprocess lenne; (c) +1 fallback-teszt a Constraints alapjan. Interaktiv bongeszos fusteszt nem futott (nincs bongeszo a kontextusban) — a readWorkspace-meres dist-bol tortent. Brief ~808 token, friss kontextus, D-009. |

### Verification performed

Acc1: 210-entitasos fixture-on a workspace-osszeallitas legfeljebb 2 git-subprocess (rev-parse + archive), spawn-szamlalos teszttel; tartalom-helyesseg (210 ticket, cimek/statuszok) ellenorzve. Acc2: azonos base-hash mellett a masodik osszeallitas 1 hivas (rev-parse), se archive, se show — cache-talalat teszttel. Acc3: uj commit a base refen invalidal — archive ujrafut, az uj ticket megjelenik. Acc4: meglevo ui-data tesztek valtozatlanul zoldek. Teljes keszlet: 15 fajl / 41 passed / 1 skipped (elozetesen letezo skip). Implementacio: egyetlen 'git archive --format=tar' + memoriabeli ustar-parser, folyamat-szintu cache resolve(root)+commit-hash kulcson; hibanal hangos stderr-warning es fajlonkenti fallback (kulon teszttel). Meres a valos repon: hideg 111 ms, meleg 38 ms. DEVIACIOK (friss agens nyilatkozata): (a) base-branchen allo elsodleges konyvtarnal +1 git status kell a nem-committed felvetelhez — a szigoru 2-es garancia ref-only osszeallitasra all, on-base reload 3 hivas, kulon teszttel rogzitve; a szerzodes Acc1-e es a Scope frissesseg-koveteleye aritmetikailag utkozott, az agens jelezte (helyes feloldas); (b) archive valasztva ls-tree+cat-file helyett, mert az ketto subprocess lenne; (c) +1 fallback-teszt a Constraints alapjan. Interaktiv bongeszos fusteszt nem futott (nincs bongeszo a kontextusban) — a readWorkspace-meres dist-bol tortent. Brief ~808 token, friss kontextus, D-009.

### Deviations

DEVIACIOK (friss agens nyilatkozata): (a) base-branchen allo elsodleges konyvtarnal +1 git status kell a nem-committed felvetelhez — a szigoru 2-es garancia ref-only osszeallitasra all, on-base reload 3 hivas, kulon teszttel rogzitve; a szerzodes Acc1-e es a Scope frissesseg-kovetelmenye aritmetikailag utkozott, az agens jelezte (helyes feloldas); (b) archive valasztva ls-tree+cat-file helyett, mert az ketto subprocess lenne; (c) +1 fallback-teszt a Constraints alapjan. Tovabba: interaktiv bongeszos fusteszt nem futott (nincs bongeszo a kontextusban) — a readWorkspace-meres dist-bol tortent.

### Findings created

None.

### Known concerns

None.
