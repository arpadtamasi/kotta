---
id: T-033
title: >-
  Harom lezart ticket Deviations mezojenek kibekitese a sajat prozajaval (T-026,
  T-029, T-030)
status: done
origin: observation
types:
  - bug
profiles: []
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
branch: fix/T-033-harom-lezart-ticket-deviations-mezojenek-kibekitese-a-sajat-
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-031
assigned_agent: claude
resolution: completed
---
# T-033 — Három lezárt ticket Deviations mezőjének kibékítése a saját prózájával

## Outcome

A T-026, T-029 és T-030 `### Deviations` szakasza azt mondja, amit a saját review-prózájuk már kimond. A repón `a-team validate` újra zöld, `DEVIATION_MISMATCH` nélkül.

## Context

F-031: a T-032-ben bevezetett kapu a saját repón három lezárt ticketet jelöl. Mindháromban a strukturált mező `None.`, miközben a `### Verification performed` deviációt nevesít — pontosan az F-019 mintája. A T-032 non-goal-ja kizárta a visszamenőleges szövegjavítást, ezért maradt a hiba a workspace-en.

Nevesített deviációk a prózából:
- **T-026** — `DEVIACIO-1`: teljes friss-ágens próbafutás a crm-kit buildben esedékes; `DEVIACIO-2`: az új ágens indításának kikényszerítése skill-szerződésben él, nem kódban.
- **T-029** — `DEVIACIOK (friss agens nyilatkozata)`: base-branchen álló elsődleges könyvtárnál +1 `git status` hívás, és a felsorolás további pontjai a ticket prózájában.
- **T-030** — `DEVIACIOK (friss agens nyilatkozata)`: +1 őrszem-teszt ismeretlen resolutionre, és a felsorolás további pontjai a ticket prózájában.

## Scope

- A három done ticket `### Deviations` szakaszának átírása: a `None.` helyére a saját prózájukban már nevesített deviációk kerülnek, a próza szövegéből átvéve, nem újraértelmezve.
- Semmi más nem változik a három fájlban — evidencia, resolution, frontmatter érintetlen.

## Non-goals

- Nem nyit újra ticketet, nem von vissza elfogadást: a deviációk annak idején el lettek fogadva, csak rossz helyre kerültek.
- Nem ír új deviációt, amit a próza nem mond ki.
- Nem érinti a oneanda workspace 14 ticketjét — más repó, külön döntés.

## Acceptance

1. A T-026, T-029, T-030 `### Deviations` szakasza a saját prózájukban szereplő deviációkat sorolja fel; `None.` egyikben sem marad.
2. `a-team validate` zölden fut, `DEVIATION_MISMATCH` nélkül.
3. A három fájl diffje kizárólag a `### Deviations` szakaszt érinti.
4. A teljes tesztkészlet zöld.

## Verification

`git diff` szakasz-szintű átnézése a három fájlon; `node dist/cli/index.js validate --json` kimenete `ok: true`; `npx vitest run`.

## Constraints

- A deviáció-szöveg forrása kizárólag az adott ticket saját prózája — új ítélet nem kerül bele.
- Az `a-team` CLI-nek nincs parancsa lezárt ticket szövegének javítására; ez tudatos, dokumentált kézi szövegszerkesztés, állapotátmenet nélkül.

## Open decisions

None.

## Execution notes

Három fájl a `.a-team/done/` alatt. A prózában a `DEVIACIO` / `DEVIACIOK` jelölés után álló felsorolás az átemelendő tartalom.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Acc1: a T-026, T-029 es T-030 '### Deviations' szakasza a sajat prozajukban nevesitett deviaciokat sorolja; 'None.' egyikben sem maradt (grep -c '^None\.' a harom fajl Deviations szakaszara: 0). T-026: DEVIACIO-1 (friss-agens probafutas a crm-kit buildben esedekes) es DEVIACIO-2 (gepi kikenyszerites skill-szerzodesben, nem kodban). T-029: DEVIACIOK (a) on-base +1 git status, (b) archive valasztasa ls-tree+cat-file helyett, (c) +1 fallback-teszt, plusz az elmaradt interaktiv bongeszos fusteszt. T-030: DEVIACIOK +1 orszem-teszt, assertClean+commit konvenciokovetes, vedekezo claim-guard. Acc2: 'node dist/cli/index.js validate --json' -> ok: true, DEVIATION_MISMATCH nulla (elotte harom). Acc3: 'git diff --stat' 3 fajl / 3 insertion / 3 deletion; a -U0 diff mindharom fajlnal egyetlen sort erint, a '### Deviations' szakaszon belul — evidencia-tablazat, Verification performed, frontmatter, resolution valtozatlan. Acc4: 'npx vitest run' 18 fajl / 55 passed / 1 skipped; 'npm run build:cli' zold. Commit: 465be0f. |

### Verification performed

Acc1: a T-026, T-029 es T-030 '### Deviations' szakasza a sajat prozajukban nevesitett deviaciokat sorolja; 'None.' egyikben sem maradt (grep -c '^None\.' a harom fajl Deviations szakaszara: 0). T-026: DEVIACIO-1 (friss-agens probafutas a crm-kit buildben esedekes) es DEVIACIO-2 (gepi kikenyszerites skill-szerzodesben, nem kodban). T-029: DEVIACIOK (a) on-base +1 git status, (b) archive valasztasa ls-tree+cat-file helyett, (c) +1 fallback-teszt, plusz az elmaradt interaktiv bongeszos fusteszt. T-030: DEVIACIOK +1 orszem-teszt, assertClean+commit konvenciokovetes, vedekezo claim-guard. Acc2: 'node dist/cli/index.js validate --json' -> ok: true, DEVIATION_MISMATCH nulla (elotte harom). Acc3: 'git diff --stat' 3 fajl / 3 insertion / 3 deletion; a -U0 diff mindharom fajlnal egyetlen sort erint, a '### Deviations' szakaszon belul — evidencia-tablazat, Verification performed, frontmatter, resolution valtozatlan. Acc4: 'npx vitest run' 18 fajl / 55 passed / 1 skipped; 'npm run build:cli' zold. Commit: 465be0f.

### Deviations

Egy szerzodesen tuli tetel: a T-029-nel a DEVIACIOK felsorolas mellett atemeltem a proza masik, DEVIACIO-jelolo nelkuli deviacios mondatat is ('interaktiv bongeszos fusteszt nem futott'). A Scope a 'nevesitett deviaciok' atemeleset kerte, ez a mondat viszont jelolo nelkul all — deviacionak olvasva emeltem be, mert egy el nem vegzett verifikaciot mond ki. Uj itelet nem kerult egyik szakaszba sem; minden mondat forrasa az adott ticket sajat prozaja.

### Findings created

None.

### Known concerns

A javitas harom lezart ticket szoveget irta at allapotatmenet nelkul, mert a CLI-nek nincs parancsa lezart ticket szovegenek javitasara — ezt a Constraints elore rogzitette, de a hianyzo CLI-ut maga is nyitott kerdes (rokon az F-022 'a store a fajlrendszer' findinggal). A oneanda workspace 14 hasonlo ticketje erintetlen: mas repo, kulon dontes.
